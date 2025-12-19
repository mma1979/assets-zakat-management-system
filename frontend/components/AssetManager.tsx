
import React, { useState, useMemo, useEffect } from 'react';
import { StoreData, Transaction, AssetType, PriceAlert } from '../types';
import { ASSET_LABELS, ASSET_UNITS } from '../constants';
import { Plus, Trash2, ArrowDown, ArrowUp, History, Coins, DollarSign, Banknote, Gem, Bell, BellRing, X, Calculator, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateAssetMetrics } from '../utils/calculations';
import { useStore } from '../services/storage';
import { CustomDatePicker } from './DatePicker';
import { ConfirmModal } from './ConfirmModal';

interface AssetManagerProps {
  data: StoreData;
  onAddTransaction: (tx: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ data, onAddTransaction, onRemoveTransaction }) => {
  const { t, language } = useLanguage();
  const { addPriceAlert, removePriceAlert } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AssetType>('GOLD');

  // New Transaction Form State
  const [formType, setFormType] = useState<'BUY' | 'SELL'>('BUY');
  const [formAsset, setFormAsset] = useState<AssetType>('GOLD');
  const [formAmount, setFormAmount] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [errors, setErrors] = useState<{ amount?: string, price?: string, date?: string }>({});

  // Alert Form State
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'TRANSACTION' | 'ALERT' } | null>(null);

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcFrom, setCalcFrom] = useState<AssetType>('USD');
  const [calcTo, setCalcTo] = useState<AssetType>('EGP');
  const [calcAmount, setCalcAmount] = useState<string>('1');

  // Determine active tab availability
  useEffect(() => {
    // If activeTab is not in rates (and not EGP/USD special cases if any), default to first
    // assuming 'EGP' is base currency and not usually a holding tab unless specified
    const exists = data.rates.find(r => r.key === activeTab);
    if (!exists && data.rates.length > 0 && activeTab !== 'EGP') {
      setActiveTab(data.rates[0].key);
    }
  }, [data.rates, activeTab]);

  const getCurrentRate = (type: AssetType) => {
    if (type === 'EGP') return 1;
    // Find rate in array
    return data.rates.find(r => r.key === type)?.value || 0;
  };

  const getAssetIcon = (type: AssetType) => {
    // Try to find icon in rates if stored there (Rate interface has icon string?)
    // For now, keep hardcoded map for known types, default to Coins
    switch (type) {
      case 'GOLD': return <Gem size={18} className="text-amber-500" />;
      case 'GOLD_21': return <Coins size={18} className="text-amber-600" />;
      case 'SILVER': return <Coins size={18} className="text-slate-400" />;
      case 'USD': return <DollarSign size={18} className="text-emerald-500" />;
      case 'EGP': return <Banknote size={18} className="text-blue-500" />;
      default: return <Coins size={18} className="text-slate-400" />;
    }
  };

  // Auto-fill price when adding a BUY transaction
  useEffect(() => {
    if (showModal && formType === 'BUY') {
      const rate = getCurrentRate(formAsset);
      if (rate > 0) {
        setFormPrice(rate.toString());
      }
    }
  }, [formAsset, formType, showModal]);

  const validateForm = () => {
    const newErrors: { amount?: string, price?: string, date?: string } = {};

    if (!formAmount || parseFloat(formAmount) <= 0) {
      newErrors.amount = t('errPositive');
    }

    if (!formPrice || parseFloat(formPrice) < 0) {
      newErrors.price = t('errPositive');
    }

    if (!formDate) {
      newErrors.date = t('errRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: formType,
      assetType: formAsset,
      amount: parseFloat(formAmount),
      pricePerUnit: parseFloat(formPrice),
      date: formDate,
      notes: ''
    };
    onAddTransaction(tx);
    setShowModal(false);
    // Reset form
    setFormAmount('');
    setFormPrice('');
    setErrors({});
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTargetPrice) return;

    const newAlert: PriceAlert = {
      id: crypto.randomUUID(),
      assetType: activeTab,
      targetPrice: parseFloat(alertTargetPrice),
      condition: alertCondition,
      isActive: true
    };

    addPriceAlert(newAlert);
    setAlertTargetPrice('');
  };

  const handleDeleteAlert = (id: string) => {
    removePriceAlert(id);
  };

  const assetMetrics = useMemo(() => {
    const metrics: Record<string, { quantity: number, avgCost: number }> = {};
    // Calculate for all RATES + EGP
    const allTypes = [...data.rates.map(r => r.key), 'EGP'];
    allTypes.forEach((type) => {
      metrics[type] = calculateAssetMetrics(data.transactions, type);
    });
    return metrics;
  }, [data.transactions, data.rates]);

  const currentTxs = data.transactions
    .filter(t => t.assetType === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeAlerts = data.priceAlerts.filter(a => a.assetType === activeTab);

  const formatCurrency = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP' });
  const formatNum = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('assetHeader')}</h2>
          <p className="text-slate-500">{t('assetSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
            title={t('priceAlerts')}
          >
            <Bell size={20} />
            <span className="hidden sm:inline">{t('priceAlerts')}</span>
          </button>
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
            title={t('assetCalculator')}
          >
            <Calculator size={20} />
            <span className="hidden sm:inline">{t('assetCalculator')}</span>
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setErrors({});
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Plus size={20} />
            {t('addTransaction')}
          </button>
        </div>
      </div>

      {/* Asset Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {data.rates.map(rate => (
          <button
            key={rate.key}
            onClick={() => setActiveTab(rate.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${activeTab === rate.key
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'text-slate-500 hover:bg-slate-100 border-transparent'
              }`}
          >
            {getAssetIcon(rate.key)}
            {rate.title || t(`asset_${rate.key}` as any) || rate.key}
          </button>
        ))}
      </div>

      {/* Stats Card for Active Asset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-slate-500 font-medium">{t('currentHoldings')}</p>
          <div className="text-3xl font-bold text-slate-800 mt-1 flex items-baseline gap-2">
            {formatNum(assetMetrics[activeTab]?.quantity ?? 0)} <span className="text-lg text-slate-400 font-normal">{ASSET_UNITS[activeTab] || 'Units'}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{t('avgPurchasePrice')}</p>
          <div className="text-3xl font-bold text-slate-800 mt-1">
            {formatCurrency(assetMetrics[activeTab]?.avgCost ?? 0)}
            <span className="text-sm text-slate-400 font-normal block">{t('perUnit')}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{t('currentMarketValue')}</p>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {formatCurrency((assetMetrics[activeTab]?.quantity ?? 0) * getCurrentRate(activeTab))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <History size={18} className="text-slate-400" />
          <h3 className="font-semibold text-slate-700">{t('txHistory')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium text-start">{t('type')}</th>
                <th className="px-6 py-3 font-medium text-start">{t('date')}</th>
                <th className="px-6 py-3 font-medium text-start">{t('amount')}</th>
                <th className="px-6 py-3 font-medium text-start">{t('priceUnit')}</th>
                <th className="px-6 py-3 font-medium text-start">{t('totalValue')}</th>
                <th className="px-6 py-3 font-medium text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {t('noTx')} {data.rates.find(r => r.key === activeTab)?.title || activeTab}.
                  </td>
                </tr>
              ) : (
                currentTxs.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {tx.type === 'BUY'
                          ? <ArrowUp size={14} className="text-emerald-600" strokeWidth={2.5} />
                          : <ArrowDown size={14} className="text-rose-600" strokeWidth={2.5} />
                        }
                        {t(tx.type === 'BUY' ? 'buy' : 'sell')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600" dir="ltr">{format(new Date(tx.date), 'dd-MM-yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {getAssetIcon(tx.assetType)}
                        <span>{formatNum(tx.amount)} {ASSET_UNITS[tx.assetType] || 'Units'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatNum(tx.pricePerUnit)} EGP</td>
                    <td className="px-6 py-4 text-slate-600">{formatNum(tx.amount * tx.pricePerUnit)} EGP</td>
                    <td className="px-6 py-4 text-end">
                      <button
                        onClick={() => setDeleteConfirm({ id: tx.id, type: 'TRANSACTION' })}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{t('addTransaction')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('asset')}</label>
                  <select
                    value={formAsset} onChange={(e) => setFormAsset(e.target.value as AssetType)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {data.rates.map(r => (
                      <option key={r.key} value={r.key}>{r.title || r.key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('type')}</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFormType('BUY')}
                      className={`flex-1 py-1 text-sm rounded-md font-medium transition-all ${formType === 'BUY' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'}`}
                    >
                      {t('buy')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('SELL')}
                      className={`flex-1 py-1 text-sm rounded-md font-medium transition-all ${formType === 'SELL' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-500'}`}
                    >
                      {t('sell')}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('date')}</label>
                <CustomDatePicker
                  value={formDate}
                  onChange={setFormDate}
                  className={errors.date ? "border-rose-500" : ""}
                />
                {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {t('amount')} ({ASSET_UNITS[formAsset] || 'Units'})
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    value={formAmount} onChange={e => setFormAmount(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 ${errors.amount
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    placeholder="0.00"
                    dir="ltr"
                  />
                  {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {t('priceUnit')} (EGP)
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    value={formPrice} onChange={e => setFormPrice(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 ${errors.price
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    placeholder="Market Rate"
                    dir="ltr"
                  />
                  {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg mt-2 transition-transform active:scale-[0.98]"
              >
                {t('saveTransaction')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800">{t('priceAlerts')} - {t(`asset_${activeTab}` as any)}</h3>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-4 bg-slate-50/50">
              <form onSubmit={handleAddAlert} className="flex gap-2">
                <select
                  value={alertCondition} onChange={(e) => setAlertCondition(e.target.value as 'ABOVE' | 'BELOW')}
                  className="p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ABOVE">{t('above')}</option>
                  <option value="BELOW">{t('below')}</option>
                </select>
                <input
                  type="number"
                  value={alertTargetPrice} onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('targetPrice')}
                  required
                />
                <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  <BellRing size={20} />
                </button>
              </form>
            </div>

            <div className="max-h-60 overflow-y-auto p-4 space-y-2">
              {activeAlerts.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4">{t('noAlerts')}</p>
              ) : (
                activeAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{alert.condition === 'ABOVE' ? t('above') : t('below')}</span>
                      <span className="mx-2 font-bold">{formatNum(alert.targetPrice)} EGP</span>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ id: alert.id, type: 'ALERT' })}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calculator size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800">{t('assetCalculator')}</h3>
              </div>
              <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* From */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('convertFrom')}</label>
                <div className="flex gap-2">
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value as AssetType)}
                    className="w-1/3 p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {data.rates.map(r => <option key={r.key} value={r.key}>{r.title || r.key}</option>)}
                  </select>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Amount"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setCalcFrom(calcTo);
                    setCalcTo(calcFrom);
                  }}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('convertTo')}</label>
                <select
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value as AssetType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {data.rates.map(r => <option key={r.key} value={r.key}>{r.title || r.key}</option>)}
                </select>
              </div>

              {/* Result */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <p className="text-sm text-emerald-600 font-medium mb-1">{t('conversionResult')}</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {(() => {
                    const amount = parseFloat(calcAmount) || 0;
                    const rateFrom = getCurrentRate(calcFrom);
                    const rateTo = getCurrentRate(calcTo);
                    if (rateTo === 0) return '0.00';
                    const result = (amount * rateFrom) / rateTo;
                    return formatNum(result);
                  })()}
                  <span className="text-sm font-normal text-emerald-600 ml-1">{ASSET_UNITS[calcTo] || 'Units'}</span>
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  1 {ASSET_UNITS[calcFrom] || 'Unit'} = {formatNum(getCurrentRate(calcFrom) / getCurrentRate(calcTo))} {ASSET_UNITS[calcTo] || 'Units'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'TRANSACTION') {
            onRemoveTransaction(deleteConfirm.id);
          } else if (deleteConfirm?.type === 'ALERT') {
            handleDeleteAlert(deleteConfirm.id);
          }
        }}
        title={deleteConfirm?.type === 'TRANSACTION' ? t('deleteConfirmTitle') : t('deleteAlertTitle')}
        message={deleteConfirm?.type === 'TRANSACTION' ? t('deleteConfirmBody') : t('deleteAlertBody')}
      />
    </div>
  );
};
