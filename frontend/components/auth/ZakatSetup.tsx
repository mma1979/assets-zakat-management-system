import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calculator, Save, ArrowRight } from 'lucide-react';
import { CustomDatePicker } from '../DatePicker';

export const ZakatSetup: React.FC = () => {
    const { t, dir } = useLanguage();
    const { data, updateZakatConfig } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();


    // Local state for form
    const [zakatDate, setZakatDate] = useState(data.zakatConfig?.zakatDate || new Date().toISOString().split('T')[0]);
    const [reminderEnabled, setReminderEnabled] = useState(data.zakatConfig?.reminderEnabled || false);
    const [email, setEmail] = useState(data.zakatConfig?.email || user?.email || '');
    const [geminiApiKey, setGeminiApiKey] = useState(data.zakatConfig?.geminiApiKey || '');
    const [baseCurrency, setBaseCurrency] = useState(data.zakatConfig?.baseCurrency || 'EGP');
    const [zakatAnniversaryDay, setZakatAnniversaryDay] = useState(data.zakatConfig?.zakatAnniversaryDay || 27);
    const [zakatAnniversaryMonth, setZakatAnniversaryMonth] = useState(data.zakatConfig?.zakatAnniversaryMonth || 9); // Ramadan
    const [useHijri, setUseHijri] = useState(!!data.zakatConfig?.zakatAnniversaryDay);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync with store if it loads late
    React.useEffect(() => {
        if (data.zakatConfig) {
            setZakatDate(data.zakatConfig.zakatDate || new Date().toISOString().split('T')[0]);
            setReminderEnabled(data.zakatConfig.reminderEnabled || false);
            setEmail(data.zakatConfig.email || user?.email || '');
            setGeminiApiKey(data.zakatConfig.geminiApiKey || '');
            setBaseCurrency(data.zakatConfig.baseCurrency || 'EGP');
            if (data.zakatConfig.zakatAnniversaryDay) {
                setZakatAnniversaryDay(data.zakatConfig.zakatAnniversaryDay);
                setZakatAnniversaryMonth(data.zakatConfig.zakatAnniversaryMonth || 9);
                setUseHijri(true);
            }
        }
    }, [data.zakatConfig]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const configPayload = { 
                zakatDate, 
                reminderEnabled, 
                email, 
                geminiApiKey, 
                baseCurrency,
                zakatAnniversaryDay: useHijri ? zakatAnniversaryDay : undefined,
                zakatAnniversaryMonth: useHijri ? zakatAnniversaryMonth : undefined
            };
            const success = await updateZakatConfig(configPayload, 'POST');
            if (success) {
                navigate('/app');
            } else {
                setError(t('configSaveError') || 'Failed to save configuration');
            }
        } catch (e) {
            setError(t('configSaveError') || 'Failed to save configuration');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir={dir}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                        <Calculator size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('zakatConfig') || 'Zakat Configuration'}</h1>
                    <p className="text-slate-500 mt-2">{t('setupZakatMsg') || 'Please configure your Zakat preferences to continue.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-semibold text-slate-700">{t('zakatDate') || 'Zakat Date'}</label>
                            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                <button 
                                    type="button"
                                    onClick={() => setUseHijri(false)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!useHijri ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t('gregorian') || 'Gregorian'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setUseHijri(true)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${useHijri ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t('hijri') || 'Hijri'}
                                </button>
                            </div>
                        </div>

                        {!useHijri ? (
                            <div>
                                <CustomDatePicker value={zakatDate} onChange={setZakatDate} />
                                <p className="text-xs text-slate-400 mt-2">{t('zakatDateHelp') || 'A fixed Gregorian date for your next Zakat calculation.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <select 
                                        value={zakatAnniversaryDay}
                                        onChange={e => setZakatAnniversaryDay(parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
                                    >
                                        {[...Array(30)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                    <select 
                                        value={zakatAnniversaryMonth}
                                        onChange={e => setZakatAnniversaryMonth(parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{t(`hijri_month_${i + 1}` as any)}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-slate-400">{t('hijriAnniversaryHelp') || 'The Zakat anniversary will repeat every lunar year automatically (e.g. 27 Ramadan).'}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('emailAddress')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            dir="ltr"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('baseCurrency') || 'Base Currency'}</label>
                        <select 
                            value={baseCurrency} 
                            onChange={e => setBaseCurrency(e.target.value)} 
                            className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                        >
                            <option value="EGP">EGP - Egyptian Pound</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="SAR">SAR - Saudi Riyal</option>
                            <option value="AED">AED - UAE Dirham</option>
                            <option value="KWD">KWD - Kuwaiti Dinar</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key (Optional)</label>
                        <input
                            type="password"
                            value={geminiApiKey}
                            onChange={e => setGeminiApiKey(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            dir="ltr"
                            placeholder="AIzaSy..."
                        />
                        <p className="text-xs text-slate-400 mt-1">Required for Market Rates & AI Advisor. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Get key here</a></p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <input
                            type="checkbox"
                            id="reminder"
                            checked={reminderEnabled}
                            onChange={e => setReminderEnabled(e.target.checked)}
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="reminder" className="text-sm text-slate-700 font-medium cursor-pointer flex-1">
                            {t('enableReminder') || 'Enable email reminders'}
                        </label>
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            'Saving...'
                        ) : (
                            <>
                                {t('saveAndContinue') || 'Save & Continue'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/app')}
                            className="text-sm text-slate-400 hover:text-slate-600 underline"
                        >
                            {t('skipForNow') || 'Skip for now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
