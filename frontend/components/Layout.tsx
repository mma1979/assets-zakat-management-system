import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Coins, FileText, Calculator, Languages, LogOut, UserCircle, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../services/storage';
import { AlertTriangle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={clsx(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
    )}
  >
    <Icon size={20} className={clsx(active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { syncError, isSyncing } = useStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed start-0 top-0 h-screen w-64 bg-white border-e border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <img src="/logo.png" alt={t('appTitle')} />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/app" icon={LayoutDashboard} label={t('dashboard')} active={location.pathname === '/app'} />
          <NavItem to="/app/assets" icon={Coins} label={t('assets')} active={location.pathname === '/app/assets'} />
          <NavItem to="/app/liabilities" icon={FileText} label={t('liabilities')} active={location.pathname === '/app/liabilities'} />
          <NavItem to="/app/zakat" icon={Calculator} label={t('zakatCalc')} active={location.pathname === '/app/zakat'} />
          <NavItem to="/app/settings" icon={Settings} label={t('settings')} active={location.pathname === '/app/settings'} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <UserCircle size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>

          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition-colors border border-slate-200"
          >
            <Languages size={18} />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <div className="text-xs text-slate-400 text-center">
            v2.5.0 &bull; {t('footer')}
          </div>
        </div>
      </aside >

      {/* Mobile Nav Placeholder */}
      < div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50" >
        <Link to="/app" className="p-2 text-slate-600"><LayoutDashboard /></Link>
        <Link to="/app/assets" className="p-2 text-slate-600"><Coins /></Link>
        <Link to="/app/liabilities" className="p-2 text-slate-600"><FileText /></Link>
        <Link to="/app/zakat" className="p-2 text-slate-600"><Calculator /></Link>
        <Link to="/app/settings" className="p-2 text-slate-600"><Settings /></Link>
        <button onClick={logout} className="p-2 text-rose-500"><LogOut /></button>
      </div >

      {/* Main Content */}
      < main className="flex-1 md:ms-64 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 relative" >
        <div className="max-w-6xl mx-auto space-y-6">
          {syncError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} />
              <p className="font-medium text-sm">{syncError}</p>
            </div>
          )}
          {isSyncing && (
            <div className="fixed top-0 left-0 w-full h-1 bg-emerald-100 z-50">
              <div className="h-full bg-emerald-500 animate-pulse w-full origin-left"></div>
            </div>
          )}
          {children}
        </div>
      </main >
    </div >
  );
};