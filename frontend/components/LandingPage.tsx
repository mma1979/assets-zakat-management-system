import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
    Shield,
    TrendingUp,
    Calculator,
    Bell,
    Smartphone,
    ArrowRight,
    CheckCircle2,
    Globe
} from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { t, dir } = useLanguage();
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-white" dir={dir}>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="ZakatVault" className="w-8 h-8" />
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                                ZakatVault
                            </span>
                        </div>
                        <nav className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/app"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    {t('dashboard') || 'Go to Dashboard'}
                                    <ArrowRight size={16} />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                                    >
                                        {t('login') || 'Login'}
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                                    >
                                        {t('getStarted') || 'Get Started'}
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-white">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        {t('landingHeroTitle') || 'Manage Your Wealth & Zakat'}
                        <span className="block text-emerald-600 mt-2">
                            {t('landingHeroSubtitle') || 'With Peace of Mind'}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
                        {t('landingHeroBody') || 'Securely track your assets, calculate Zakat obligations accurately, and stay updated with real-time market rates.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-bold text-lg flex items-center justify-center gap-2"
                        >
                            {t('startFree') || 'Start for Free'}
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all font-bold text-lg"
                        >
                            {t('login') || 'Login'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-slate-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('featureSecure') || 'Secure & Private'}</h3>
                            <p className="text-slate-500">
                                {t('featureSecureBody') || 'Your financial data is encrypted and stored securely. We prioritize your privacy above all else.'}
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('featureRates') || 'Live Market Rates'}</h3>
                            <p className="text-slate-500">
                                {t('featureRatesBody') || 'Real-time gold, silver, and currency rates ensure your Zakat calculations are always accurate.'}
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-slate-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Calculator size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('featureCalc') || 'Smart Calculator'}</h3>
                            <p className="text-slate-500">
                                {t('featureCalcBody') || 'Automatically calculate Zakat on Gold, Silver, Cash, Stocks, and Business Assets.'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile App Teaser */}
            <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6">
                                {t('comingSoon') || 'Coming Soon'}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                {t('mobileAppTitle') || 'Manage Zakat on the Go'}
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0">
                                {t('mobileAppBody') || 'Experience the full power of ZakatVault on your iOS and Android devices. Sync seamlessly across all platforms.'}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button disabled className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all opacity-80 hover:opacity-100 cursor-not-allowed">
                                    <Smartphone size={24} className="text-emerald-400" />
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400">Download on the</div>
                                        <div className="text-sm font-bold">App Store</div>
                                    </div>
                                </button>
                                <button disabled className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all opacity-80 hover:opacity-100 cursor-not-allowed">
                                    <Smartphone size={24} className="text-emerald-400" />
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400">Get it on</div>
                                        <div className="text-sm font-bold">Google Play</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Fake Phone Mockup */}
                        <div className="flex-1 relative">
                            <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                                <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                                <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                                <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-50 flex flex-col items-center justify-center">
                                    <img src="/logo.png" className="w-20 h-20 mb-4 opacity-50" />
                                    <div className="text-slate-300 font-bold text-xl">ZakatVault App</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="ZakatVault" className="w-6 h-6 grayscale opacity-50" />
                            <span className="text-slate-400 font-semibold">ZakatVault &copy; {new Date().getFullYear()}</span>
                        </div>
                        <div className="flex gap-6 text-slate-500 text-sm">
                            <a href="#" className="hover:text-emerald-600">Privacy Policy</a>
                            <a href="#" className="hover:text-emerald-600">Terms of Service</a>
                            <a href="#" className="hover:text-emerald-600">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
