
import { useState, useEffect, useCallback } from 'react';
import { StoreData, Transaction, Liability, MarketRates, ZakatConfig, PriceAlert } from '../types';
import { DEFAULT_RATES } from '../constants';
import { format } from 'date-fns';
import { getStoredToken } from './auth';
import http from './http';


const API_ENDPOINT = '/api/data';

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

export const useStore = () => {
  // Initialize from local storage if possible for immediate render
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
       // If it looks like a Basic Auth string (from legacy/mock), use Basic
       // Otherwise use Bearer
       if (token.startsWith('mock-jwt-token')) {
          headers['Authorization'] = 'Basic ' + btoa('mabdelhay:Abc@1234');
       } else {
          headers['Authorization'] = `Bearer ${token}`;
       }
    }
    return headers;
  };

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      // If no token, we can't fetch data, rely on empty initial or cache
      const token = getStoredToken();
      if (!token) {
        setIsLoaded(true);
        return;
      }

      try {
        const response = await http.get(API_ENDPOINT, { headers: getAuthHeaders() });
        if (response.status === 200) {
          const remoteData = response.data;
          // Merge remote data with default structure to prevent runtime errors
          const mergedData = {
            transactions: Array.isArray(remoteData.transactions) ? remoteData.transactions : [],
            liabilities: Array.isArray(remoteData.liabilities) ? remoteData.liabilities : [],
            rates: remoteData.rates || DEFAULT_RATES,
            zakatConfig: {
              ...INITIAL_DATA.zakatConfig, // keep defaults like env email if not in remote
              ...(remoteData.zakatConfig || {}) 
            },
            priceAlerts: Array.isArray(remoteData.priceAlerts) ? remoteData.priceAlerts : []
          };
          setData(mergedData);
          persistLocal(mergedData); // Update cache
          setSyncError(null);
        } else {
          if (response.status === 404) {
             console.log("No remote data, keeping local state.");
          } else {
             throw new Error(`Server returned status: ${response.status}`);
          }
        }
      } catch (e) {
        console.error("Failed to load data:", e);
        setSyncError("Cannot connect to cloud. Working offline (changes saved locally).");
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Helper to sync data to server
  const saveData = async (newData: StoreData) => {
    // 1. Optimistic Update (Local)
    setData(newData);
    persistLocal(newData);

    // 2. Background Sync (Remote)
    const token = getStoredToken();
    if (!token) return; // Cannot save to cloud without auth

    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const response = await http.post(API_ENDPOINT, newData, { headers: getAuthHeaders() });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }
    } catch (e) {
      console.error("Save failed:", e);
      setSyncError("Cloud sync failed. Data saved locally.");
    } finally {
      setIsSyncing(false);
    }
  };

  const addTransaction = useCallback((tx: Transaction) => {
    const newData = { ...data, transactions: [...data.transactions, tx] };
    saveData(newData);
  }, [data]);

  const removeTransaction = useCallback((id: string) => {
    const newData = { ...data, transactions: data.transactions.filter(t => t.id !== id) };
    saveData(newData);
  }, [data]);

  const addLiability = useCallback((l: Liability) => {
    const newData = { ...data, liabilities: [...data.liabilities, l] };
    saveData(newData);
  }, [data]);

  const removeLiability = useCallback((id: string) => {
    const newData = { ...data, liabilities: data.liabilities.filter(l => l.id !== id) };
    saveData(newData);
  }, [data]);

  const updateRates = useCallback((rates: MarketRates) => {
    const newData = { ...data, rates };
    saveData(newData);
  }, [data]);

  const updateZakatConfig = useCallback((zakatConfig: ZakatConfig) => {
    const newData = { ...data, zakatConfig };
    saveData(newData);
  }, [data]);

  const updatePriceAlerts = useCallback((priceAlerts: PriceAlert[]) => {
    const newData = { ...data, priceAlerts };
    saveData(newData);
  }, [data]);

  return {
    data,
    isLoaded,
    isSyncing,
    syncError,
    addTransaction,
    removeTransaction,
    addLiability,
    removeLiability,
    updateRates,
    updateZakatConfig,
    updatePriceAlerts
  };
};
