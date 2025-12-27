import React, { useState } from 'react';
import { ZakatPayment } from '../types';
import { Plus, Trash2, Calendar, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';

interface ZakatPaymentManagerProps {
  payments: ZakatPayment[];
  onAddPayment: (payment: ZakatPayment) => void;
  onRemovePayment: (id: number) => void;
  isSyncing?: boolean;
}

export const ZakatPaymentManager: React.FC<ZakatPaymentManagerProps> = ({
  payments,
  onAddPayment,
  onRemovePayment,
  isSyncing
}) => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    onAddPayment({
      id: Date.now(),
      amount: parseFloat(amount),
      date: date,
      notes: notes.trim() || undefined
    });

    setAmount('');
    setNotes('');
  };

  const formatCurrency = (val: number) => 
    val.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP' });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Receipt size={20} />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-800">{t('zakatPayments')}</h4>
            <p className="text-xs text-slate-500">{payments.length} {t('recordsFound')}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-100 space-y-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amount')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notes')}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={isSyncing}
                className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {payments.length === 0 ? (
              <p className="text-center py-4 text-sm text-slate-400 italic">{t('noPaymentsYet')}</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-600">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">{formatCurrency(p.amount)}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        {p.date} {p.notes && <span>• {p.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemovePayment(p.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
