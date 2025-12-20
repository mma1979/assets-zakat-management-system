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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync with store if it loads late
    React.useEffect(() => {
        if (data.zakatConfig) {
            setZakatDate(data.zakatConfig.zakatDate || new Date().toISOString().split('T')[0]);
            setReminderEnabled(data.zakatConfig.reminderEnabled || false);
            setEmail(data.zakatConfig.email || user?.email || '');
            setGeminiApiKey(data.zakatConfig.geminiApiKey || '');
        }
    }, [data.zakatConfig]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const success = await updateZakatConfig({ zakatDate, reminderEnabled, email, geminiApiKey }, 'POST');
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('zakatDueDate')}</label>
                        <CustomDatePicker value={zakatDate} onChange={setZakatDate} />
                        <p className="text-xs text-slate-400 mt-1">{t('zakatDateHelp') || 'The date your Zakat is due (usually 1 year after reaching Nisab).'}</p>
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
