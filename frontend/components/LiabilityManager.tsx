import React, { useState } from 'react';
import { StoreData, Liability } from '../types';
import { Trash2, Calendar, DollarSign, CheckCircle2, MinusCircle, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomDatePicker } from './DatePicker';
import { ConfirmModal } from './ConfirmModal';
import { formatNumber } from '../utils/formatters';

interface LiabilityManagerProps {
  data: StoreData;
  onAddLiability: (l: Liability) => void;
  onRemoveLiability: (id: number) => void;
  onDecreaseLiability: (id: number, amount: number) => Promise<boolean>;
}

export const LiabilityManager: React.FC<LiabilityManagerProps> = ({ data, onAddLiability, onRemoveLiability, onDecreaseLiability }) => {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isDeductible, setIsDeductible] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [decreaseState, setDecreaseState] = useState<{ id: number; amount: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLiability({
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      dueDate,
      isDeductible
    });
    setTitle('');
    setAmount('');
    setDueDate('');
    setIsDeductible(true);
  };

  const baseCurrency = data.zakatConfig?.baseCurrency || 'EGP';
  const formatNum = (val: number) => formatNumber(val, language);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('liabHeader')}</h2>
          <p className="text-slate-500">{t('liabSubtitle')}</p>
        </div>

        <div className="space-y-4">
          {data.liabilities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              {t('noLiab')}
            </div>
          ) : (
            data.liabilities.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${item.isDeductible ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Calendar size={12} />
                      {item.dueDate ? format(new Date(item.dueDate), 'dd-MM-yyyy') : t('noDate')}
                      <span className="text-slate-300">|</span>
                      <span>{item.isDeductible ? t('deductible') : t('notDeductible')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-lg text-slate-700 block">-{formatNum(item.amount)} {baseCurrency}</span>
                    {decreaseState?.id === item.id ? (
                      <div className="flex items-center gap-2 mt-1 animate-fade-in">
                        <input
                          type="number"
                          autoFocus
                          value={decreaseState.amount}
                          onChange={e => setDecreaseState({ ...decreaseState, amount: e.target.value })}
                          className="w-24 p-1 text-sm border rounded bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="Amount"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const val = parseFloat(decreaseState.amount);
                              if (!isNaN(val) && val > 0) {
                                onDecreaseLiability(item.id, val);
                                setDecreaseState(null);
                              }
                            } else if (e.key === 'Escape') {
                              setDecreaseState(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(decreaseState.amount);
                            if (!isNaN(val) && val > 0) {
                              onDecreaseLiability(item.id, val);
                              setDecreaseState(null);
                            }
                          }}
                          className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setDecreaseState(null)}
                          className="text-slate-400 hover:bg-slate-100 p-1 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDecreaseState({ id: item.id, amount: '' })}
                        className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hover:underline"
                      >
                        {t('decreaseValue') || 'Decrease Value'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-4">
          <h3 className="font-bold text-lg text-slate-800 mb-4">{t('addLiability')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('title')}</label>
              <input
                type="text" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('title')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('amount')} ({baseCurrency})</label>
              <input
                type="number" required min="0" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('dueDate')}</label>
              <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
              />
            </div>

            <div
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${isDeductible ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
              onClick={() => setIsDeductible(!isDeductible)}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isDeductible ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                {isDeductible && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{t('isDeductible')}</p>
                <p className="text-xs text-slate-400">{t('isDeductibleHint')}</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl mt-2 transition-transform active:scale-[0.98]"
            >
              {t('addLiability')}
            </button>
          </form>
        </div>
      </div>


      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onRemoveLiability(deleteId);
            setDeleteId(null);
          }
        }}
        title={t('deleteLiabTitle')}
        message={t('deleteLiabBody')}
      />
    </div >
  );
};