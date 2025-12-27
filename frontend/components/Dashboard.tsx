import React, { useMemo, useState } from 'react';
import { StoreData, Rate, Transaction } from '../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TrendingUp, DollarSign, Scale, RefreshCw, AlertCircle, Edit2, X, Download, FileSpreadsheet, Coins } from 'lucide-react';
import { fetchMarketRates } from '../services/geminiService';
import { exportTransactionsToCSV, exportLiabilitiesToCSV, exportPortfolioSummaryToCSV } from '../services/exportService';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FinancialAdvisor } from './FinancialAdvisor';
import { Shield, ShieldAlert, ArrowRight } from 'lucide-react';


interface DashboardProps {
  data: StoreData;
  onUpdateRates: (rates: Rate[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateRates }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Rate Editing State
  // Rate Editing State
  // Flattening not needed as much now, but we can keep local state for array
  // Actually the modal was for manually setting rates. We should probably use the new Settings Modal or similar?
  // For now, let's just make it edit the array, or better yet, redirect to settings?
  // The 'UpdateRates' modal old logic:
  // const [editRates, setEditRates] = useState<MarketRates>(data.rates);
  // Replaced with:
  const [editRates, setEditRates] = useState<Rate[]>([]); // We'll just load data.rates into it when opening

  // Helper for dynamic colors
  const getAssetColor = (assetType: string) => {
    const colors: Record<string, string> = {
      GOLD: '#fbbf24',
      GOLD_21: '#f59e0b',
      SILVER: '#94a3b8',
      USD: '#10b981',
      EGP: '#3b82f6',
      // Fallbacks
    };
    if (colors[assetType]) return colors[assetType];
    // Generate a consistent color from string if not known
    let hash = 0;
    for (let i = 0; i < assetType.length; i++) {
      hash = assetType.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // Calculate Net Worth & Breakdown
  const summary = useMemo(() => {
    // 1. Initialize holdings dynamically
    const holdings: Record<string, number> = { EGP: 0 };
    data.rates.forEach(r => holdings[r.key] = 0);

    data.transactions.forEach(tx => {
      // Ensure key exists
      if (holdings[tx.assetType] === undefined) holdings[tx.assetType] = 0;

      if (tx.type === 'BUY') holdings[tx.assetType] += tx.amount;
      else holdings[tx.assetType] -= tx.amount;
    });

    // 2. Calculate values
    const values: Record<string, number> = { EGP: holdings.EGP };
    data.rates.forEach(r => {
      values[r.key] = (holdings[r.key] || 0) * r.value;
    });

    const totalAssets = Object.values(values).reduce((a, b) => a + b, 0);
    const totalLiabilities = data.liabilities.reduce((acc, l) => acc + l.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    return { holdings, values, totalAssets, totalLiabilities, netWorth };
  }, [data]);

  // Generate Historical Data for Line Chart
  const historyData = useMemo(() => {
    // 1. Group transactions by date
    const txsByDate = new Map<string, Transaction[]>();
    data.transactions.forEach(tx => {
      const date = tx.date.split('T')[0];
      if (!txsByDate.has(date)) txsByDate.set(date, []);
      txsByDate.get(date)?.push(tx);
    });

    const sortedDates = Array.from(txsByDate.keys()).sort();

    // 2. Initialize cumulative quantities and prices
    const qty: Record<string, number> = { EGP: 0 };
    const prices: Record<string, number> = { EGP: 1 };

    data.rates.forEach(r => {
      qty[r.key] = 0;
      prices[r.key] = 0;
    });

    const result: any[] = [];

    // 3. Process each date
    sortedDates.forEach(date => {
      const dayTxs = txsByDate.get(date) || [];
      dayTxs.forEach(tx => {
        if (qty[tx.assetType] === undefined) qty[tx.assetType] = 0;

        if (tx.type === 'BUY') qty[tx.assetType] += tx.amount;
        else qty[tx.assetType] -= tx.amount;

        if (tx.pricePerUnit > 0) {
          prices[tx.assetType] = tx.pricePerUnit;
        }
      });

      // Calculate total value at this snapshot
      const snapshot: any = { date, EGP: qty.EGP };
      data.rates.forEach(r => {
        // Use historical price if available (from tx updates), otherwise 0? 
        // Issue: if no tx for this asset yet, price is 0. 
        // Ideally we'd need historical rates. For now we rely on last known tx price.
        snapshot[r.key] = (qty[r.key] || 0) * (prices[r.key] || 0);
      });
      result.push(snapshot);
    });

    // 4. Add "Today" data point with current market rates
    const today = format(new Date(), 'yyyy-MM-dd');
    if (result.length === 0 || result[result.length - 1].date !== today) {
      const todaySnapshot: any = { date: today, EGP: qty.EGP };
      data.rates.forEach(r => {
        todaySnapshot[r.key] = (qty[r.key] || 0) * r.value;
      });
      result.push(todaySnapshot);
    }

    return result;
  }, [data.transactions, data.rates]);

  // Dynamic Pie Chart Data
  const pieChartData = useMemo(() => {
    const pData = [
      { name: t('asset_EGP'), value: summary.values.EGP, color: getAssetColor('EGP') }
    ];
    data.rates.forEach(r => {
      if (summary.values[r.key] > 0) {
        pData.push({
          name: r.title || r.key, // Or translate? t(`asset_${r.key}`) might fail
          value: summary.values[r.key],
          color: getAssetColor(r.key)
        });
      }
    });
    return pData.filter(d => d.value > 0);
  }, [summary, data.rates, t]);

  const handleRefreshRates = async () => {
    setUpdating(true);
    setError(null);
    try {
      const newRates = await fetchMarketRates(data.rates, data.zakatConfig?.geminiApiKey);
      onUpdateRates(newRates);
    } catch (e) {
      setError(t('checkNetwork'));
    } finally {
      setUpdating(false);
    }
  };

  /* Manual Edit Removed/Refactored to match new API structure.
     If we want manual edit here, we'd need to iterate the array.
     For now, let's assume 'Update Rates' just refreshes or we redirect to settings.
     Or we implement a simple implementation for the old modal.
  */
  const handleManualRateSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified: Just pass back the edited rates array
    // Ensure lastUpdated is updated
    const timestamp = new Date().toISOString();
    const updated = editRates.map(r => ({ ...r, lastUpdated: timestamp }));
    onUpdateRates(updated);
    setShowRateModal(false);
  };

  // Pie chart data handled in useMemo above now

  const formatCurrency = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP' });
  const formatNum = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG');

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h2>
          <p className="text-slate-500">{t('dashSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-end hidden sm:block">
            <div className="text-slate-500">{t('ratesUpdated')}</div>
            <div className="font-mono font-medium text-slate-700" dir="ltr">
              {/* Take distinct lastUpdated from first rate or just show now?
                  Assuming all rates update together usually. */}
              {data.rates.length > 0 ? format(new Date(data.rates[0].lastUpdated), 'MMM dd, HH:mm') : '-'}
            </div>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
            title={t('exportData')}
          >
            <Download size={20} />
          </button>

          <button
            onClick={() => {
              setEditRates([...data.rates]);
              setShowRateModal(true);
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
            title={t('edit')}
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={handleRefreshRates}
            disabled={updating}
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors disabled:opacity-50"
            title={t('refreshRates')}
          >
            <RefreshCw size={20} className={updating ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {user && !user.isTwoFactorEnabled && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{t('secureYourAccount') || 'Secure Your Account'}</h4>
              <p className="text-sm text-slate-600">
                {t('twoFactorRecommendation') || 'Two-Factor Authentication is currently disabled. We highly recommend enabling it to protect your Zakat data.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.hash = '#settings'} 
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-all whitespace-nowrap shadow-sm"
          >
            {t('enableNow') || 'Enable Now'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* AI Advisor Section - Placed prominently */}
      <div className="w-full">
        <FinancialAdvisor data={data} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('netWorth')}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(isNaN(summary?.netWorth ?? 0) ? 0 : summary?.netWorth)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('totalAssets')}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(isNaN(summary?.totalAssets ?? 0) ? 0 : summary?.totalAssets)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-full">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('totalLiabilities')}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(isNaN(summary?.totalLiabilities ?? 0) ? 0 : summary?.totalLiabilities)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie Chart: Composition */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px] flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('portfolioComp')}</h3>
          {pieChartData.length > 0 ? (
            <div className="flex-1 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              {t('noAssets')}
            </div>
          )}
        </div>

        {/* Current Rates List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{t('currentRates')}</h3>
            <button onClick={() => { setEditRates(data.rates); setShowRateModal(true); }} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">{t('edit')}</button>
          </div>
          <div className="space-y-4">
            {data.rates.map(rate => {
              const getIcon = (iconName: string) => {
                // Simple mapping or use lucide dynamic if possible, but safe fallback
                if (iconName === 'Gem') return <TrendingUp size={18} className="text-amber-500" />; // Fallback/Gem
                if (iconName === 'DollarSign') return <DollarSign size={18} className="text-emerald-500" />;
                return <Coins size={18} className="text-slate-500" />;
              };

              return (
                <div key={rate.key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-white rounded-md shadow-sm">
                      {/* Just using generic icon for now or map similarly to Settings */}
                      {getIcon(rate.icon)}
                    </div>
                    <span className="font-medium text-slate-700">{rate.title || rate.key}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatNum(rate.value)} {rate.key === 'USD' ? 'EGP/$' : 'EGP'}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800">
            {t('rateInfo')}
            {/* Metadata like dataSources removed from basic Rate type, can be added back if API provides it separately or in Rate object */}
          </div>
        </div>
      </div>

      {/* History Line Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">{t('portfolioHistory')}</h3>
        <p className="text-sm text-slate-500 mb-6">{t('historySubtitle')}</p>

        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => {
                  try {
                    return format(new Date(val), 'dd-MM-yyyy');
                  } catch (e) {
                    return val;
                  }
                }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <RechartsTooltip
                formatter={(val: number) => formatCurrency(val)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="EGP" name={t('asset_EGP')} stroke={getAssetColor('EGP')} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              {data.rates.map(r => (
                <Line
                  key={r.key}
                  type="monotone"
                  dataKey={r.key}
                  name={r.title || r.key}
                  stroke={getAssetColor(r.key)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manual Rate Edit Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{t('updateRates')}</h3>
              <button onClick={() => setShowRateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleManualRateSave} className="p-6 space-y-4">
              {editRates.map((rate, idx) => (
                <div key={rate.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{rate.title} ({rate.key})</label>
                  <input
                    type="number"
                    required
                    value={rate.value}
                    onChange={e => {
                      const newArr = [...editRates];
                      newArr[idx] = { ...newArr[idx], value: parseFloat(e.target.value) };
                      setEditRates(newArr);
                    }}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    dir="ltr"
                    step="any"
                  />
                </div>
              ))}
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg">{t('saveRates')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={20} />
                <h3 className="font-bold text-slate-800">{t('exportData')}</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 mb-2">{t('exportSubtitle')}</p>

              <button
                onClick={() => {
                  exportTransactionsToCSV(data.transactions);
                  setShowExportModal(false);
                }}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download size={18} />
                {t('downloadTxs')}
              </button>

              <button
                onClick={() => {
                  exportLiabilitiesToCSV(data.liabilities);
                  setShowExportModal(false);
                }}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download size={18} />
                {t('downloadLiabs')}
              </button>

              <button
                onClick={() => {
                  exportPortfolioSummaryToCSV(summary, data.rates);
                  setShowExportModal(false);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200"
              >
                <Download size={18} />
                {t('downloadSummary')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};