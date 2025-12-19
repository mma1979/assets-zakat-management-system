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
import { FinancialAdvisor } from './FinancialAdvisor';


interface DashboardProps {
  data: StoreData;
  onUpdateRates: (rates: Rate[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateRates }) => {
  const { t, language } = useLanguage();
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

  // Calculate Net Worth & Breakdown
  const summary = useMemo(() => {
    // 1. Calculate holdings using FIFO logic for quantities
    const holdings: Record<string, number> = { GOLD: 0, GOLD_21: 0, SILVER: 0, USD: 0, EGP: 0 };

    data.transactions.forEach(tx => {
      if (tx.type === 'BUY') holdings[tx.assetType] += tx.amount;
      else holdings[tx.assetType] -= tx.amount;
    });

    const values = {
      GOLD: holdings.GOLD * (data.rates.find(r => r.key === 'GOLD')?.value || 0),
      GOLD_21: holdings.GOLD_21 * (data.rates.find(r => r.key === 'GOLD_21')?.value || 0),
      SILVER: holdings.SILVER * (data.rates.find(r => r.key === 'SILVER')?.value || 0),
      USD: holdings.USD * (data.rates.find(r => r.key === 'USD')?.value || 0),
      EGP: holdings.EGP
    };

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
      // Normalize to date string YYYY-MM-DD
      const date = tx.date.split('T')[0];
      if (!txsByDate.has(date)) txsByDate.set(date, []);
      txsByDate.get(date)?.push(tx);
    });

    const sortedDates = Array.from(txsByDate.keys()).sort();

    // 2. Initialize cumulative quantities and last known prices
    const qty = { GOLD: 0, GOLD_21: 0, SILVER: 0, USD: 0, EGP: 0 };
    // Start prices at 0 or base. For history, we use the transaction price as the "market rate" at that time.
    const prices = { GOLD: 0, GOLD_21: 0, SILVER: 0, USD: 0, EGP: 1 };

    const result: any[] = [];

    // 3. Process each date
    sortedDates.forEach(date => {
      const dayTxs = txsByDate.get(date) || [];
      dayTxs.forEach(tx => {
        // Update cumulative quantity
        if (tx.type === 'BUY') qty[tx.assetType] += tx.amount;
        else qty[tx.assetType] -= tx.amount;

        // Update price if meaningful (assume transaction reflects market rate)
        if (tx.pricePerUnit > 0) {
          prices[tx.assetType] = tx.pricePerUnit;
        }
      });

      // Calculate total value at this snapshot
      result.push({
        date,
        GOLD: qty.GOLD * prices.GOLD,
        GOLD_21: qty.GOLD_21 * prices.GOLD_21,
        SILVER: qty.SILVER * prices.SILVER,
        USD: qty.USD * prices.USD,
        EGP: qty.EGP // EGP is base, value = amount
      });
    });

    // 4. Add "Today" data point with current market rates
    const today = format(new Date(), 'yyyy-MM-dd');
    if (result.length === 0 || result[result.length - 1].date !== today) {
      result.push({
        date: today,
        GOLD: qty.GOLD * (data.rates.find(r => r.key === 'GOLD')?.value || 0),
        GOLD_21: qty.GOLD_21 * (data.rates.find(r => r.key === 'GOLD_21')?.value || 0),
        SILVER: qty.SILVER * (data.rates.find(r => r.key === 'SILVER')?.value || 0),
        USD: qty.USD * (data.rates.find(r => r.key === 'USD')?.value || 0),
        EGP: qty.EGP
      });
    }

    return result;
  }, [data.transactions, data.rates]);

  const handleRefreshRates = async () => {
    setUpdating(true);
    setError(null);
    try {
      const newRates = await fetchMarketRates(data.rates);
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

  const pieChartData = [
    { name: t('asset_GOLD'), value: summary.values.GOLD, color: '#fbbf24' },
    { name: t('asset_GOLD_21'), value: summary.values.GOLD_21, color: '#f59e0b' },
    { name: t('asset_SILVER'), value: summary.values.SILVER, color: '#94a3b8' },
    { name: t('asset_USD'), value: summary.values.USD, color: '#10b981' },
    { name: t('asset_EGP'), value: summary.values.EGP, color: '#3b82f6' },
  ].filter(d => d.value > 0);

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
              <Line type="monotone" dataKey="GOLD" name={t('asset_GOLD')} stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="GOLD_21" name={t('asset_GOLD_21')} stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="SILVER" name={t('asset_SILVER')} stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="USD" name={t('asset_USD')} stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="EGP" name={t('asset_EGP')} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
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