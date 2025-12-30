import { useState, useEffect, useCallback } from 'react';
import { StoreData, Transaction, Liability, Rate, ZakatConfig, PriceAlert, ZakatCalculationResult, ZakatPayment, ZakatCycle } from '../types';
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
  zakatCalc: '/api/ZakatCalc',
  zakatCycles: '/api/zakatcycles'
} as const;

type DataKey = keyof typeof API_ENDPOINTS;

const INITIAL_DATA: StoreData = {
  transactions: [],
  liabilities: [],
  rates: [],
  zakatConfig: {
    zakatDate: format(new Date(), 'yyyy-MM-dd'),
    reminderEnabled: false,
    email: '',
    geminiApiKey: '',
    baseCurrency: 'EGP'
  },
  priceAlerts: [],
  zakatPayments: [],
  zakatCycles: []
};

const fetchData = async <T,>(key: DataKey, defaultValue: T): Promise<T> => {
  try {
    const response = await http.get(API_ENDPOINTS[key]);
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 404) {
      return defaultValue;
    } else {
      throw new Error(`Server returned status: ${response.status}`);
    }
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return defaultValue;
  }
};

const saveDataPart = async <T, R = any>(key: DataKey, value: T, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<R | null> => {
  try {
    const response = await (http as any)[method.toLowerCase()](API_ENDPOINTS[key], value);
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
    zakatCalc: false,
    zakatCycles: false
  });

  const loadAllData = useCallback(async () => {
    setIsLoaded(false);
    try {
      const [transactions, liabilities, rates, zakatConfig, priceAlerts, zakatPayments, zakatCycles] = await Promise.all([
        fetchData<Transaction[]>('transactions', []),
        fetchData<Liability[]>('liabilities', []),
        fetchData<Rate[]>('rates', INITIAL_DATA.rates),
        fetchData<ZakatConfig>('zakatConfig', INITIAL_DATA.zakatConfig),
        fetchData<PriceAlert[]>('priceAlerts', []),
        fetchData<ZakatPayment[]>('zakatPayments', []),
        fetchData<ZakatCycle[]>('zakatCycles', [])
      ]);
      setData({ transactions, liabilities, rates, zakatConfig, priceAlerts, zakatPayments, zakatCycles });
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
      }
    } catch (e) {
      setSyncError("Failed to save transaction.");
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== tempId) }));
    } finally {
      setIsSyncing(false);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  const removeTransaction = useCallback(async (id: number) => {
    setIsSyncing(true);
    try {
      await http.delete(`${API_ENDPOINTS.transactions}/${id}`);
      await loadAllData();
    } catch (e) {
      setSyncError("Failed to delete transaction.");
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const addLiability = useCallback(async (l: Liability) => {
    const tempId = l.id;
    setData(prev => ({ ...prev, liabilities: [...prev.liabilities, l] }));
    setIsSyncing(true);
    try {
      const savedLiab = await saveDataPart<Liability, Liability>('liabilities', l, 'POST');
      if (savedLiab) {
        setData(prev => ({
          ...prev,
          liabilities: prev.liabilities.map(item => item.id === tempId ? savedLiab : item)
        }));
      }
    } catch (e) {
      setSyncError("Failed to save liability.");
      setData(prev => ({ ...prev, liabilities: prev.liabilities.filter(item => item.id !== tempId) }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const removeLiability = useCallback(async (id: number) => {
    setIsSyncing(true);
    try {
      await http.delete(`${API_ENDPOINTS.liabilities}/${id}`);
      await loadAllData();
    } catch (e) {
      setSyncError("Failed to delete liability.");
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const decreaseLiability = useCallback(async (id: number, amount: number) => {
    setIsSyncing(true);
    try {
      await http.patch(`${API_ENDPOINTS.liabilities}/${id}/decrease`, { amount });
      await loadAllData();
      return true;
    } catch (e) {
      setSyncError("Failed to decrease liability.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const reorderRates = useCallback(async (newOrder: { id: number, order: number }[]) => {
    setIsSyncing(true);
    try {
      await http.put(`${API_ENDPOINTS.rates}/reorder`, newOrder);
      await loadAllData();
    } catch (error) {
      setSyncError("Failed to reorder rates");
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const updateRates = useCallback(async (rates: Rate[]) => {
    setIsSyncing(true);
    try {
      const payload = rates.map(r => ({ id: r.id, value: r.value }));
      await http.put(API_ENDPOINTS.rates, payload);
      await loadAllData();
    } catch (error) {
      setSyncError("Failed to update rates");
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const addRate = useCallback(async (key: string, value: number, icon?: string, title?: string) => {
    setIsSyncing(true);
    try {
      const payload = { key, value, icon, title };
      const response = await http.post(API_ENDPOINTS.rates, payload);
      if (response.status >= 200 && response.status < 300) {
        await loadAllData();
        return true;
      }
      return false;
    } catch (error) {
      setSyncError("Failed to add rate");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const removeRate = useCallback(async (id: number) => {
    setIsSyncing(true);
    try {
      const response = await http.delete(`${API_ENDPOINTS.rates}/${id}`);
      if (response.status >= 200 && response.status < 300) {
        await loadAllData();
        return true;
      }
      return false;
    } catch (error) {
      setSyncError("Failed to delete rate");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const updateZakatConfig = useCallback(async (config: Partial<ZakatConfig>, method: 'POST' | 'PUT' = 'PUT') => {
    setIsSyncing(true);
    try {
      const updated = await saveDataPart<Partial<ZakatConfig>, ZakatConfig>('zakatConfig', config, method);
      if (updated) {
        setData(prev => ({ ...prev, zakatConfig: updated }));
        if (config.zakatAnniversaryDay || config.zakatAnniversaryMonth) {
           const cycles = await fetchData<ZakatCycle[]>('zakatCycles', []);
           setData(prev => ({ ...prev, zakatCycles: cycles }));
        }
        return true;
      }
      return false;
    } catch (e) {
      setSyncError("Failed to update Zakat configuration");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const addPriceAlert = useCallback(async (alert: PriceAlert) => {
    const tempId = alert.id;
    setData(prev => ({ ...prev, priceAlerts: [...prev.priceAlerts, alert] }));
    setIsSyncing(true);
    try {
      const savedAlert = await saveDataPart<PriceAlert, PriceAlert>('priceAlerts', alert, 'POST');
      if (savedAlert) {
        setData(prev => ({
          ...prev,
          priceAlerts: prev.priceAlerts.map(a => a.id === tempId ? savedAlert : a)
        }));
      }
    } catch (e) {
      setSyncError("Failed to save alert.");
      setData(prev => ({ ...prev, priceAlerts: prev.priceAlerts.filter(a => a.id !== tempId) }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const removePriceAlert = useCallback(async (id: number) => {
    setIsSyncing(true);
    try {
      await http.delete(`${API_ENDPOINTS.priceAlerts}/${id}`);
      setData(prev => ({ ...prev, priceAlerts: prev.priceAlerts.filter(a => a.id !== id) }));
    } catch (e) {
      setSyncError("Failed to delete alert.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const addZakatPayment = useCallback(async (payment: ZakatPayment) => {
    const tempId = payment.id;
    setData(prev => ({ ...prev, zakatPayments: [...prev.zakatPayments, payment] }));
    setIsSyncing(true);
    try {
      const savedPayment = await saveDataPart<ZakatPayment, ZakatPayment>('zakatPayments', payment, 'POST');
      if (savedPayment) {
        setData(prev => ({
          ...prev,
          zakatPayments: prev.zakatPayments.map(p => p.id === tempId ? savedPayment : p)
        }));
      }
    } catch (e) {
      setSyncError("Failed to save Zakat payment.");
      setData(prev => ({ ...prev, zakatPayments: prev.zakatPayments.filter(p => p.id !== tempId) }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const removeZakatPayment = useCallback(async (id: number) => {
    setIsSyncing(true);
    try {
      await http.delete(`${API_ENDPOINTS.zakatPayments}/${id}`);
      setData(prev => ({ ...prev, zakatPayments: prev.zakatPayments.filter(p => p.id !== id) }));
    } catch (e) {
      setSyncError("Failed to delete Zakat payment.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const fetchZakatCalculation = useCallback(async (): Promise<ZakatCalculationResult | null> => {
    return await fetchData<ZakatCalculationResult | null>('zakatCalc', null);
  }, []);

  return {
    data,
    isLoaded,
    isSyncing,
    syncError,
    loadingStates,
    loadAllData,
    addTransaction,
    removeTransaction,
    addLiability,
    removeLiability,
    decreaseLiability,
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