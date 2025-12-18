import { useState, useEffect, useCallback } from 'react';
import { StoreData, Transaction, Liability, MarketRates, ZakatConfig, PriceAlert, ZakatCalculationResult } from '../types';
import { DEFAULT_RATES } from '../constants';
import { format } from 'date-fns';
import { getStoredToken } from './auth';
import http from './http';

// API Endpoints
const API_ENDPOINTS = {
  transactions: '/api/transactions',
  liabilities: '/api/liabilities',
  rates: '/api/rates',
  zakatConfig: '/api/zakat-config',
  priceAlerts: '/api/price-alerts',
  zakatCalc: '/api/ZakatCalc'
} as const;

const INITIAL_DATA: StoreData = {
  transactions: [],
  liabilities: [],
  rates: DEFAULT_RATES,
  zakatConfig: {
    zakatDate: format(new Date(), 'yyyy-MM-dd'),
    reminderEnabled: false,
    email: process.env.NOTIFICATION_EMAIL && !process.env.NOTIFICATION_EMAIL.includes('__APP_')
      ? process.env.NOTIFICATION_EMAIL
      : ''
  },
  priceAlerts: []
};

type DataKey = keyof typeof API_ENDPOINTS;

// Helper to safely persist to local storage
const persistLocal = (newData: StoreData) => {
  try {
    localStorage.setItem('zakat_vault_offline_cache', JSON.stringify(newData));
  } catch (e) {
    console.error("Local persistence failed", e);
  }
};

// Helper to get Auth headers dynamically
const getAuthHeaders = () => {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    if (token.startsWith('mock-jwt-token')) {
      headers['Authorization'] = 'Basic ' + btoa('mabdelhay:Abc@1234');
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Generic fetch function for any data type
const fetchData = async <T,>(key: DataKey, defaultValue: T): Promise<T> => {
  try {
    const response = await http.get(API_ENDPOINTS[key], { headers: getAuthHeaders() });
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 404) {
      console.log(`No remote data for ${key}, using default.`);
      return defaultValue;
    } else {
      throw new Error(`Server returned status: ${response.status}`);
    }
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return defaultValue;
  }
};

// Generic save function for any data type
const saveDataPart = async <T,>(key: DataKey, value: T): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await http.post(API_ENDPOINTS[key], value, { headers: getAuthHeaders() });
    return response.status >= 200 && response.status < 300;
  } catch (e) {
    console.error(`Save failed for ${key}:`, e);
    return false;
  }
};

export const useStore = () => {
  const [data, setData] = useState<StoreData>(() => {
    try {
      const cached = localStorage.getItem('zakat_vault_offline_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error("Cache read error", e);
    }
    return INITIAL_DATA;
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<DataKey, boolean>>({
    transactions: false,
    liabilities: false,
    rates: false,
    zakatConfig: false,
    priceAlerts: false,
    zakatCalc: false
  });

  // Load all data from API
  const loadAllData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoaded(true);
      return;
    }

    try {
      // Load all data in parallel
      const [transactions, liabilities, rates, zakatConfig, priceAlerts] = await Promise.all([
        fetchData('transactions', INITIAL_DATA.transactions),
        fetchData('liabilities', INITIAL_DATA.liabilities),
        fetchData('rates', INITIAL_DATA.rates),
        fetchData('zakatConfig', INITIAL_DATA.zakatConfig as ZakatConfig),
        fetchData('priceAlerts', INITIAL_DATA.priceAlerts)
      ]);

      const mergedData: StoreData = {
        transactions: Array.isArray(transactions) ? transactions : [],
        liabilities: Array.isArray(liabilities) ? liabilities : [],
        rates: rates || DEFAULT_RATES,
        zakatConfig: {
          ...INITIAL_DATA.zakatConfig,
          ...(zakatConfig || {})
        },
        priceAlerts: Array.isArray(priceAlerts) ? priceAlerts : []
      };

      setData(mergedData);
      persistLocal(mergedData);
      setSyncError(null);
    } catch (e) {
      console.error("Failed to load data:", e);
      setSyncError("Cannot connect to cloud. Working offline (changes saved locally).");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Helper to update data and sync specific part
  const updateDataPart = async <K extends keyof StoreData>(
    key: K,
    value: StoreData[K],
    remotePayload?: any
  ) => {
    // 1. Optimistic Update (Local)
    const newData = { ...data, [key]: value };
    setData(newData);
    persistLocal(newData);

    // 2. Background Sync (Remote)
    const token = getStoredToken();
    if (!token) return;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setSyncError(null);

    const success = await saveDataPart(key, remotePayload !== undefined ? remotePayload : value);

    if (!success) {
      setSyncError(`Cloud sync failed for ${key}. Data saved locally.`);
    }

    setIsSyncing(false);
    setLoadingStates(prev => ({ ...prev, [key]: false }));
    return success;
  };

  // Transaction operations
  const addTransaction = useCallback((tx: Transaction) => {
    const newTransactions = [...data.transactions, tx];
    updateDataPart('transactions', newTransactions, tx);
  }, [data.transactions]);

  const removeTransaction = useCallback(async (id: string) => {
    // Optimistic remove? Maybe better to wait for server since we reload?
    // User requested: "call Delete ... then reload data again"
    // So we will trigger delete then reload.

    const token = getStoredToken();
    if (!token) {
      // Offline / No Auth fallback: just remove locally
      const newTransactions = data.transactions.filter(t => t.id !== id);
      updateDataPart('transactions', newTransactions);
      return;
    }

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, transactions: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.transactions}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        await loadAllData();
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete transaction:", e);
      setSyncError("Failed to delete transaction on server.");
      // Optional: Revert? The local data wasn't changed yet if we strictly follow "Delete then reload".
      // But if we want optimistic, we should have removed it first.
      // Given request "call Delete ... then reload", I will Stick to that flow.
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }
  }, [data.transactions, loadAllData]);

  // Liability operations
  const addLiability = useCallback((l: Liability) => {
    const newLiabilities = [...data.liabilities, l];
    updateDataPart('liabilities', newLiabilities, l);
  }, [data.liabilities]);

  const removeLiability = useCallback(async (id: string) => {
    const token = getStoredToken();
    if (!token) {
      // Offline / No Auth fallback
      const newLiabilities = data.liabilities.filter(l => l.id !== id);
      updateDataPart('liabilities', newLiabilities);
      return;
    }

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, liabilities: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.liabilities}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        await loadAllData();
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete liability:", e);
      setSyncError("Failed to delete liability on server.");
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, liabilities: false }));
    }
  }, [data.liabilities, loadAllData]);

  // Rates operations
  const updateRates = useCallback((rates: MarketRates) => {
    updateDataPart('rates', rates);
  }, []);

  // Zakat config operations
  const updateZakatConfig = useCallback((zakatConfig: ZakatConfig) => {
    return updateDataPart('zakatConfig', zakatConfig);
  }, []);

  // Price alerts operations
  const addPriceAlert = useCallback((alert: PriceAlert) => {
    const newAlerts = [...data.priceAlerts, alert];
    return updateDataPart('priceAlerts', newAlerts, alert);
  }, [data.priceAlerts]);

  const removePriceAlert = useCallback(async (id: string) => {
    const token = getStoredToken();
    if (!token) {
      // Offline fallback
      const newAlerts = data.priceAlerts.filter(a => a.id !== id);
      return updateDataPart('priceAlerts', newAlerts);
    }

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, priceAlerts: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.priceAlerts}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        // Reload or filter locally
        const newAlerts = data.priceAlerts.filter(a => a.id !== id);
        setData(prev => ({ ...prev, priceAlerts: newAlerts }));
        // Also persist local to stay in sync
        persistLocal({ ...data, priceAlerts: newAlerts });
        return true;
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete alert:", e);
      setSyncError("Failed to delete alert on server.");
      return false;
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, priceAlerts: false }));
    }
  }, [data.priceAlerts]);

  const fetchZakatCalculation = useCallback(async () => {
    return fetchData<ZakatCalculationResult | null>('zakatCalc', null);
  }, []);

  return {
    data,
    isLoaded,
    isSyncing,
    syncError,
    loadingStates,
    addTransaction,
    removeTransaction,
    addLiability,
    removeLiability,
    updateRates,
    updateZakatConfig,

    addPriceAlert,
    removePriceAlert,
    fetchZakatCalculation
  };
};