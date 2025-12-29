import { useState, useEffect, useCallback } from 'react';
import { StoreData, Transaction, Liability, Rate, ZakatConfig, PriceAlert, ZakatCalculationResult, ZakatPayment } from '../types';
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
  zakatPayments: '/api/zakat-payments',
  zakatCalc: '/api/ZakatCalc'
} as const;

const INITIAL_DATA: StoreData = {
  transactions: [],
  liabilities: [],
  rates: [],
  zakatConfig: {
    zakatDate: format(new Date(), 'yyyy-MM-dd'),
    reminderEnabled: false,
    email: process.env.NOTIFICATION_EMAIL && !process.env.NOTIFICATION_EMAIL.includes('__APP_')
      ? process.env.NOTIFICATION_EMAIL
      : '',
    geminiApiKey: '',
    baseCurrency: 'EGP'
  },
  priceAlerts: [],
  zakatPayments: []
};

type DataKey = keyof typeof API_ENDPOINTS;

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
const saveDataPart = async <T, R = any>(key: DataKey, value: T, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<R | null> => {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await (http as any)[method.toLowerCase()](API_ENDPOINTS[key], value, { headers: getAuthHeaders() });
    if (response.status >= 200 && response.status < 300) {
      return response.data || (true as any);
    }
    return null;
  } catch (e) {
    console.error(`Save failed for ${key}:`, e);
    return null;
  }
};

export const useStore = () => {
  const [data, setData] = useState<StoreData>(INITIAL_DATA);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<DataKey, boolean>>({
    transactions: false,
    liabilities: false,
    rates: false,
    zakatConfig: false,
    priceAlerts: false,
    zakatPayments: false,
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
      const [transactions, liabilities, rates, zakatConfig, priceAlerts, zakatPayments] = await Promise.all([
        fetchData('transactions', INITIAL_DATA.transactions),
        fetchData('liabilities', INITIAL_DATA.liabilities),
        fetchData('rates', INITIAL_DATA.rates),
        fetchData('zakatConfig', INITIAL_DATA.zakatConfig),
        fetchData('priceAlerts', INITIAL_DATA.priceAlerts),
        fetchData('zakatPayments', INITIAL_DATA.zakatPayments)
      ]);

      const mergedData: StoreData = {
        transactions: Array.isArray(transactions) ? transactions : [],
        liabilities: Array.isArray(liabilities) ? liabilities : [],
        rates: Array.isArray(rates) ? rates : [],
        zakatConfig: {
          ...INITIAL_DATA.zakatConfig,
          ...(zakatConfig || {})
        },
        priceAlerts: Array.isArray(priceAlerts) ? priceAlerts : [],
        zakatPayments: Array.isArray(zakatPayments) ? zakatPayments : []
      };

      setData(mergedData);
      setSyncError(null);
    } catch (e) {
      console.error("Failed to load data:", e);
      setSyncError("Failed to load data from server.");
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
    remotePayload?: any,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
  ) => {
    const token = getStoredToken();
    if (!token) return false;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setSyncError(null);

    const success = await saveDataPart(key, remotePayload !== undefined ? remotePayload : value, method);

    if (success) {
      setData(prev => ({ ...prev, [key]: value }));
    } else {
      setSyncError(`Failed to save ${key}.`);
    }

    setIsSyncing(false);
    setLoadingStates(prev => ({ ...prev, [key]: false }));
    return success;
  };

  // Transaction operations
  const addTransaction = useCallback(async (tx: Transaction) => {
    const tempId = tx.id;
    setData(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, transactions: true }));

    try {
      const savedTx = await saveDataPart<Transaction, Transaction>('transactions', tx, 'POST');
      if (savedTx) {
        setData(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.id === tempId ? savedTx : t)
        }));
      } else {
        throw new Error("Failed to save transaction");
      }
    } catch (e) {
      console.error(e);
      setSyncError("Failed to save transaction.");
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== tempId) }));
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  const removeTransaction = useCallback(async (id: number) => {
    const token = getStoredToken();
    if (!token) return;

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
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }
  }, [loadAllData]);

  // Liability operations
  const addLiability = useCallback(async (l: Liability) => {
    const tempId = l.id;
    setData(prev => ({ ...prev, liabilities: [...prev.liabilities, l] }));
    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, liabilities: true }));

    try {
      const savedLiab = await saveDataPart<Liability, Liability>('liabilities', l, 'POST');
      if (savedLiab) {
        setData(prev => ({
          ...prev,
          liabilities: prev.liabilities.map(item => item.id === tempId ? savedLiab : item)
        }));
      } else {
        throw new Error("Failed to save liability");
      }
    } catch (e) {
      console.error(e);
      setSyncError("Failed to save liability.");
      setData(prev => ({ ...prev, liabilities: prev.liabilities.filter(item => item.id !== tempId) }));
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, liabilities: false }));
    }
  }, []);

  const removeLiability = useCallback(async (id: number) => {
    const token = getStoredToken();
    if (!token) return;

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
  }, [loadAllData]);

  // Rates operations
  const updateRates = useCallback(async (rates: Rate[]) => {
    const token = getStoredToken();
    if (!token) return;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, rates: true }));

    try {
      const payload = rates.map(r => ({ id: r.id, value: r.value }));
      const response = await http.put(API_ENDPOINTS.rates, payload, { headers: getAuthHeaders() });

      if (response.status >= 200 && response.status < 300) {
        setData(prev => {
          const currentRates = [...prev.rates];
          rates.forEach(updatedRate => {
            const index = currentRates.findIndex(r => r.id === updatedRate.id);
            if (index !== -1) {
              currentRates[index] = { ...currentRates[index], ...updatedRate };
            }
          });
          return { ...prev, rates: currentRates };
        });
      } else {
        throw new Error(`Update rates failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to update rates:", error);
      setSyncError("Failed to update rates");
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, rates: false }));
    }
  }, []);

  const reorderRates = useCallback(async (newOrder: { id: number, order: number }[]) => {
    const token = getStoredToken();
    if (!token) return;

    setData(prev => {
      const updatedRates = prev.rates.map(r => {
        const orderItem = newOrder.find(item => item.id === r.id);
        return orderItem ? { ...r, order: orderItem.order } : r;
      }).sort((a, b) => (a.order || 0) - (b.order || 0));
      return { ...prev, rates: updatedRates };
    });

    try {
      const response = await http.put(`${API_ENDPOINTS.rates}/reorder`, newOrder, { headers: getAuthHeaders() });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Reorder failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to reorder rates:", error);
      setSyncError("Failed to reorder rates");
      await loadAllData();
    }
  }, [loadAllData]);

  const addRate = useCallback(async (key: string, value: number, icon?: string, title?: string) => {
    const token = getStoredToken();
    if (!token) return false;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, rates: true }));

    try {
      const payload = { key, value, icon, title };
      const response = await http.post(API_ENDPOINTS.rates, payload, { headers: getAuthHeaders() });

      if (response.status >= 200 && response.status < 300) {
        const returnedRate = response.data as Rate;
        const newRate: Rate = returnedRate?.id ? returnedRate : {
          id: Date.now(),
          key,
          value,
          icon: icon || 'Coins',
          title: title || key,
          lastUpdated: new Date().toISOString()
        };

        const filtered = data.rates.filter(r => r.key !== key);
        const newRates = [...filtered, newRate];

        setData(prev => ({ ...prev, rates: newRates }));
        return true;
      } else {
        throw new Error(`Add rate failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to add rate:", error);
      setSyncError("Failed to add rate");
      return false;
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, rates: false }));
    }
  }, [data.rates]);

  const removeRate = useCallback(async (id: number) => {
    const token = getStoredToken();
    if (!token) return true;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, rates: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.rates}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        const newRates = data.rates.filter(r => r.id !== id);
        setData(prev => ({ ...prev, rates: newRates }));
        return true;
      } else {
        throw new Error(`Delete rate failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to delete rate:", error);
      setSyncError("Failed to delete rate");
      return false;
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, rates: false }));
    }
  }, [data.rates]);

  // Zakat config operations
  const updateZakatConfig = useCallback((zakatConfig: ZakatConfig, method: 'POST' | 'PUT' = 'PUT') => {
    return updateDataPart('zakatConfig', zakatConfig, undefined, method);
  }, []);

  // Price alerts operations
  const addPriceAlert = useCallback(async (alert: PriceAlert) => {
    const tempId = alert.id;
    setData(prev => ({ ...prev, priceAlerts: [...prev.priceAlerts, alert] }));
    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, priceAlerts: true }));

    try {
      const savedAlert = await saveDataPart<PriceAlert, PriceAlert>('priceAlerts', alert, 'POST');
      if (savedAlert) {
        setData(prev => ({
          ...prev,
          priceAlerts: prev.priceAlerts.map(a => a.id === tempId ? savedAlert : a)
        }));
      } else {
        throw new Error("Failed to save alert");
      }
    } catch (e) {
      console.error(e);
      setSyncError("Failed to save alert.");
      setData(prev => ({ ...prev, priceAlerts: prev.priceAlerts.filter(a => a.id !== tempId) }));
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, priceAlerts: false }));
    }
  }, []);

  const removePriceAlert = useCallback(async (id: number) => {
    const token = getStoredToken();
    if (!token) return false;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, priceAlerts: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.priceAlerts}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        const newAlerts = data.priceAlerts.filter(a => a.id !== id);
        setData(prev => ({ ...prev, priceAlerts: newAlerts }));
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

  // Zakat payment operations
  const addZakatPayment = useCallback(async (payment: ZakatPayment) => {
    const tempId = payment.id;
    setData(prev => ({ ...prev, zakatPayments: [...prev.zakatPayments, payment] }));
    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, zakatPayments: true }));

    try {
      const savedPayment = await saveDataPart<ZakatPayment, ZakatPayment>('zakatPayments', payment, 'POST');
      if (savedPayment) {
        setData(prev => ({
          ...prev,
          zakatPayments: prev.zakatPayments.map(p => p.id === tempId ? savedPayment : p)
        }));
      } else {
        throw new Error("Failed to save Zakat payment");
      }
    } catch (e) {
      console.error(e);
      setSyncError("Failed to save Zakat payment.");
      setData(prev => ({ ...prev, zakatPayments: prev.zakatPayments.filter(p => p.id !== tempId) }));
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, zakatPayments: false }));
    }
  }, []);

  const removeZakatPayment = useCallback(async (id: number) => {
    const token = getStoredToken();
    if (!token) return false;

    setIsSyncing(true);
    setLoadingStates(prev => ({ ...prev, zakatPayments: true }));

    try {
      const response = await http.delete(`${API_ENDPOINTS.zakatPayments}/${id}`, { headers: getAuthHeaders() });
      if (response.status >= 200 && response.status < 300) {
        const newPayments = data.zakatPayments.filter(p => p.id !== id);
        setData(prev => ({ ...prev, zakatPayments: newPayments }));
        return true;
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete Zakat payment:", e);
      setSyncError("Failed to delete Zakat payment on server.");
      return false;
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, zakatPayments: false }));
    }
  }, [data.zakatPayments]);

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
    addRate,
    removeRate,
    updateRates,
    reorderRates,
    updateZakatConfig,
    addPriceAlert,
    removePriceAlert,
    addZakatPayment,
    removeZakatPayment,
    fetchZakatCalculation
  };
};