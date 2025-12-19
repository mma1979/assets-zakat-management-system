import React, { useState, useMemo } from 'react';
import { StoreData, AssetType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getPortfolioAdvice } from '../services/geminiService';
import { Sparkles, Bot, AlertTriangle, Loader2 } from 'lucide-react';
import { calculateAssetMetrics } from '../utils/calculations';

interface FinancialAdvisorProps {
  data: StoreData;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ data }) => {
  const { t, language } = useLanguage();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const holdings = useMemo(() => {
    const result: Record<AssetType, { quantity: number; avgCost: number; currentPrice: number }> = {} as any;
    const types: AssetType[] = ['GOLD', 'GOLD_21', 'SILVER', 'USD'];

    types.forEach(type => {
      const { quantity, avgCost } = calculateAssetMetrics(data.transactions, type);
      let currentPrice = 0;
      const rate = data.rates.find(r => r.key === type);
      if (rate) currentPrice = rate.value;

      result[type] = { quantity, avgCost, currentPrice };
    });
    return result;
  }, [data.transactions, data.rates]);

  const handleGetAdvice = async () => {
    setLoading(true);
    try {
      const result = await getPortfolioAdvice(holdings, language);
      setAdvice(result);
    } catch (e) {
      setAdvice(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{t('advisorTitle')}</h3>
            <p className="text-sm text-slate-500">{t('advisorSubtitle')}</p>
          </div>
        </div>
      </div>

      {!advice ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Bot size={48} className="text-indigo-200" />
          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? t('analyzing') : t('getAdvice')}
          </button>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
          <div className="prose prose-indigo max-w-none text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
            {advice}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <AlertTriangle size={14} />
            {t('adviceDisclaimer')}
          </div>
          <button onClick={() => setAdvice(null)} className="mt-4 text-xs text-indigo-600 font-medium hover:underline">
            {t('refreshRates')}
          </button>
        </div>
      )}
    </div>
  );
};