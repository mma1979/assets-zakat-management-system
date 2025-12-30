import React, { useState, useEffect } from 'react';
import { User, Shield, Info, LogOut, CheckCircle, AlertTriangle, Trash2, Edit2, Plus, Bell, Key, Globe, Layout, Smartphone, Mail, Lock, Settings as SettingsIcon, Save, Coins, DollarSign, Gem, Landmark, Bitcoin, Banknote, CreditCard, Wallet, CircleDollarSign, ChevronDown, Euro, PoundSterling, JapaneseYen, RussianRuble, IndianRupee, TrendingUp, BarChart3, PieChart, Activity, Briefcase, Building2, Vault, PiggyBank, Factory, Warehouse, Container, Plane, Ship, Tractor, X, GripVertical, Calculator, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../services/storage';
import { changePassword, disable2Fa } from '../services/auth';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';
import { ConfirmModal } from './ConfirmModal';
import { CustomDatePicker } from './DatePicker';
import { AssetType } from '../types';
import { useSearchParams } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { data, updateZakatConfig, addPriceAlert, removePriceAlert, addRate, removeRate, reorderRates } = useStore();
  const { user, logout, updateUser } = useAuth();
  const [searchParams] = useSearchParams();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'config' | 'timeline' | 'security' | 'alerts' | 'rates'>(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'config', 'timeline', 'security', 'alerts', 'rates'].includes(tab)) return tab as any;
    return 'profile';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'config', 'timeline', 'security', 'alerts', 'rates'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Profile / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  // Security / 2FA State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisable2FaConfirm, setShowDisable2FaConfirm] = useState(false);
  const [is2FaEnabled, setIs2FaEnabled] = useState(user?.isTwoFactorEnabled || false);

  // Zakat Config State
  const [zakatDate, setZakatDate] = useState(data.zakatConfig?.zakatDate || '');
  const [reminderEnabled, setReminderEnabled] = useState(data.zakatConfig?.reminderEnabled || false);
  const [email, setEmail] = useState(data.zakatConfig?.email || '');
  const [geminiApiKey, setGeminiApiKey] = useState(data.zakatConfig?.geminiApiKey || '');
  const [baseCurrency, setBaseCurrency] = useState(data.zakatConfig?.baseCurrency || 'EGP');
  const [zakatMsg, setZakatMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmittingZakat, setIsSubmittingZakat] = useState(false);
  const [useHijri, setUseHijri] = useState(!!data.zakatConfig?.zakatAnniversaryDay);
  const [zakatAnniversaryDay, setZakatAnniversaryDay] = useState(data.zakatConfig?.zakatAnniversaryDay || 27);
  const [zakatAnniversaryMonth, setZakatAnniversaryMonth] = useState(data.zakatConfig?.zakatAnniversaryMonth || 9);

  // Price Alert State
  const [newAlertAsset, setNewAlertAsset] = useState<AssetType>('GOLD');
  const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [deleteAlertId, setDeleteAlertId] = useState<number | null>(null);
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);

  // Rates State
  const [showRateModal, setShowRateModal] = useState(false);
  const [newRateKey, setNewRateKey] = useState('');
  const [newRateValue, setNewRateValue] = useState('');
  const [newRateTitle, setNewRateTitle] = useState('');
  const [newRateIcon, setNewRateIcon] = useState('Coins');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [msgRates, setMsgRates] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [draggedRateId, setDraggedRateId] = useState<number | null>(null);

  const AVAILABLE_ICONS: Record<string, any> = {
    Coins, DollarSign, Gem, Landmark, Bitcoin, Banknote, CreditCard, Wallet, CircleDollarSign,
    Euro, PoundSterling, JapaneseYen, RussianRuble, IndianRupee,
    TrendingUp, BarChart3, PieChart, Activity,
    Briefcase, Building2, Vault, PiggyBank, Factory, Warehouse, Container, Plane, Ship, Tractor
  };

  useEffect(() => {
    if (data.zakatConfig) {
      setZakatDate(data.zakatConfig.zakatDate || '');
      setReminderEnabled(data.zakatConfig.reminderEnabled || false);
      setEmail(data.zakatConfig.email || '');
      setGeminiApiKey(data.zakatConfig.geminiApiKey || '');
      setBaseCurrency(data.zakatConfig.baseCurrency || 'EGP');
      if (data.zakatConfig.zakatAnniversaryDay) {
        setZakatAnniversaryDay(data.zakatConfig.zakatAnniversaryDay);
        setZakatAnniversaryMonth(data.zakatConfig.zakatAnniversaryMonth || 9);
        setUseHijri(true);
      }
    }
  }, [data.zakatConfig]);

  useEffect(() => {
    setIs2FaEnabled(user?.isTwoFactorEnabled || false);
  }, [user?.isTwoFactorEnabled]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: t('pwdMismatch') });
      return;
    }
    setIsSubmittingPwd(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        setPwdMessage({ type: 'success', text: t('passwordChangedSuccess') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMessage({ type: 'error', text: t('pwdUpdateError') });
      }
    } catch (error: any) {
      setPwdMessage({ type: 'error', text: error.message || t('pwdUpdateError') });
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  const handleZakatSave = async () => {
    setZakatMsg(null);
    setIsSubmittingZakat(true);
    try {
      await updateZakatConfig({ 
        zakatDate, 
        reminderEnabled, 
        email, 
        geminiApiKey, 
        baseCurrency,
        zakatAnniversaryDay: useHijri ? zakatAnniversaryDay : undefined,
        zakatAnniversaryMonth: useHijri ? zakatAnniversaryMonth : undefined
      });
      setZakatMsg({ type: 'success', text: t('saveSuccess') });
    } catch (e: any) {
      setZakatMsg({ type: 'error', text: t('configSaveError') });
    } finally {
      setIsSubmittingZakat(false);
    }
  };

  const toggle2Fa = async () => {
    if (is2FaEnabled) {
      setShowDisable2FaConfirm(true);
    } else {
      setShowSetupModal(true);
    }
  };

  const handleConfirmDisable2Fa = async () => {
    const success = await disable2Fa();
    if (success) {
      setIs2FaEnabled(false);
      updateUser({ isTwoFactorEnabled: false });
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertPrice) return;
    setIsSubmittingAlert(true);
    try {
      await addPriceAlert({
        id: Date.now(),
        assetType: newAlertAsset,
        condition: newAlertCondition,
        targetPrice: parseFloat(newAlertPrice),
        isActive: true
      });
      setNewAlertPrice('');
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateKey || !newRateValue) return;
    setIsSavingRates(true);
    addRate(newRateKey, parseFloat(newRateValue), newRateIcon, newRateTitle)
      .then(() => {
        setShowRateModal(false);
        setNewRateKey('');
        setNewRateValue('');
        setNewRateTitle('');
      })
      .finally(() => setIsSavingRates(false));
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedRateId(id);
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceId === targetId) return;
    
    const currentRates = [...data.rates];
    const sourceIdx = currentRates.findIndex(r => r.id === sourceId);
    const targetIdx = currentRates.findIndex(r => r.id === targetId);
    
    const [moved] = currentRates.splice(sourceIdx, 1);
    currentRates.splice(targetIdx, 0, moved);
    
    reorderRates(currentRates.map((r, i) => ({ id: r.id, order: i + 1 })));
    setDraggedRateId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={dir}>
      <header>
        <h2 className="text-2xl font-bold text-slate-800">{t('settings')}</h2>
        <p className="text-slate-500">{t('settingsSubtitle')}</p>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', icon: User, label: t('tabProfile') },
          { id: 'config', icon: Calculator, label: t('zakatConfig') },
          { id: 'timeline', icon: History, label: t('zakatTimeline') || 'Timeline' },
          { id: 'security', icon: Shield, label: t('securitySettings') || 'Security' },
          { id: 'alerts', icon: Bell, label: t('priceAlerts') },
          { id: 'rates', icon: Coins, label: t('manageRates') || 'Rates' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Lock size={20} className="text-emerald-600" />
              {t('changePassword')}
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('currentPassword')}</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('newPassword')}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirmNewPassword')}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
              </div>
              {pwdMessage && <p className={`text-sm ${pwdMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{pwdMessage.text}</p>}
              <button type="submit" disabled={isSubmittingPwd} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
                {isSubmittingPwd ? 'Updating...' : t('changePasswordButton')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <SettingsIcon size={20} className="text-emerald-600" />
              {t('zakatConfig')}
            </h3>
            <div className="space-y-4 max-w-md">
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} className="w-full p-2 border rounded-lg" dir="ltr" placeholder="AIzaSy..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('baseCurrency') || 'Base Currency'}</label>
                <select 
                  value={baseCurrency} 
                  onChange={e => setBaseCurrency(e.target.value)} 
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="QAR">QAR - Qatari Riyal</option>
                  <option value="TRY">TRY - Turkish Lira</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="reminder" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                <label htmlFor="reminder" className="text-slate-700">{t('enableReminder')}</label>
              </div>
              {zakatMsg && <p className={`text-sm ${zakatMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{zakatMsg.text}</p>}
              <button onClick={handleZakatSave} disabled={isSubmittingZakat} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
                <Save size={18} />
                {isSubmittingZakat ? 'Saving...' : t('saveConfig')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-emerald-600" />
              {t('zakatTimeline')}
            </h3>
            
            <div className="relative">
              {(!data.zakatCycles || data.zakatCycles.length === 0) ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-slate-400 italic">{t('noZakatCycles')}</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-slate-200 before:to-transparent">
                  {data.zakatCycles.map((cycle) => (
                    <div key={cycle.id} className="relative flex items-start gap-6 group">
                      <div className={`mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-md z-10 transition-colors ${
                        cycle.status === 'Paid' ? 'bg-emerald-500 text-white' : 
                        cycle.status === 'Due' ? 'bg-amber-500 text-white animate-pulse' : 
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {cycle.status === 'Paid' ? <CheckCircle size={18} /> : 
                         cycle.status === 'Due' ? <AlertTriangle size={18} /> : 
                         <Activity size={18} />}
                      </div>
                      
                      <div className="flex-1 bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-emerald-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              {cycle.hijriYear} {t('hijriYearShort')}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                cycle.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                cycle.status === 'Due' ? 'bg-amber-100 text-amber-700' : 
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {t(`status_${cycle.status.toLowerCase()}` as any) || cycle.status}
                              </span>
                            </h4>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Globe size={14} />
                              {new Date(cycle.gregorianDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-black text-slate-900 leading-none">
                               {cycle.zakatDue.toLocaleString()} <span className="text-xs font-normal text-slate-400 uppercase">{data.zakatConfig.baseCurrency}</span>
                             </div>
                             <p className="text-xs text-slate-400 mt-1">{t('totalZakatDue') || 'Total Zakat Due'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg">
                           <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('assets')}</p>
                              <p className="text-sm font-semibold text-slate-700">{cycle.totalAssets.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('liabilities')}</p>
                              <p className="text-sm font-semibold text-slate-700">{cycle.totalLiabilities.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('paid')}</p>
                              <p className="text-sm font-semibold text-emerald-600 font-mono">{cycle.amountPaid.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('remaining')}</p>
                              <p className="text-sm font-semibold text-slate-700 font-mono">{(cycle.zakatDue - cycle.amountPaid).toLocaleString()}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield size={20} className="text-emerald-600" />
              {t('securitySettings') || 'Security'}
            </h3>

            {!is2FaEnabled && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                  <Shield size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">{t('recommendedTitle') || 'Strongly Recommended'}</h4>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {t('twoFactorBenefit') || 'Two-Factor Authentication adds an extra layer of security to your account. Even if someone knows your password, they won\'t be able to access your Zakat data without your physical device.'}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{t('twoFactorAuth')}</h4>
                  <p className="text-sm text-slate-500">{t('twoFactorSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={toggle2Fa}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  is2FaEnabled 
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {is2FaEnabled ? t('disable2Fa') : t('enable2Fa')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bell size={20} className="text-emerald-600" />
              {t('priceAlerts')}
            </h3>
            <div className="space-y-3">
              {data.priceAlerts.length === 0 && <p className="text-slate-400 italic text-sm">{t('noAlerts')}</p>}
              {data.priceAlerts.map(alert => (
                <div key={alert.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <span className="font-semibold">{t(`asset_${alert.assetType}` as any)} {alert.condition === 'ABOVE' ? '>' : '<'} {alert.targetPrice}</span>
                  </div>
                  <button onClick={() => removePriceAlert(alert.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddAlert} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl">
              <select value={newAlertAsset} onChange={e => setNewAlertAsset(e.target.value as any)} className="p-2 border rounded-lg bg-white flex-1">
                {data.rates.map(r => <option key={r.key} value={r.key}>{r.title || r.key}</option>)}
              </select>
              <select value={newAlertCondition} onChange={e => setNewAlertCondition(e.target.value as any)} className="p-2 border rounded-lg bg-white w-24">
                <option value="ABOVE">{t('above')}</option>
                <option value="BELOW">{t('below')}</option>
              </select>
              <input type="number" value={newAlertPrice} onChange={e => setNewAlertPrice(e.target.value)} className="p-2 border rounded-lg w-32" placeholder="0.00" step="any" required />
              <button type="submit" disabled={isSubmittingAlert} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Plus size={24} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Coins size={20} className="text-emerald-600" />
                {t('manageRates')}
              </h3>
              <button onClick={() => setShowRateModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700">
                <Plus size={16} />
                {t('addRate')}
              </button>
            </div>
            <div className="space-y-3">
              {data.rates.map(rate => {
                const IconComp = AVAILABLE_ICONS[rate.icon] || Coins;
                return (
                  <div key={rate.id} draggable onDragStart={e => handleDragStart(e, rate.id)} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, rate.id)}
                    className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all ${draggedRateId === rate.id ? 'opacity-50 border-emerald-300 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-slate-300 cursor-grab" />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-emerald-600">
                        <IconComp size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{rate.title || rate.key}</p>
                        <p className="text-xs text-slate-400">{rate.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-slate-900">{rate.value.toLocaleString()}</span>
                      <button onClick={() => removeRate(rate.id)} className="text-slate-300 hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showSetupModal && <TwoFactorSetupModal onClose={() => setShowSetupModal(false)} onSuccess={() => {
        setIs2FaEnabled(true);
        updateUser({ isTwoFactorEnabled: true });
      }} />}

      <ConfirmModal
        isOpen={showDisable2FaConfirm}
        onClose={() => setShowDisable2FaConfirm(false)}
        onConfirm={handleConfirmDisable2Fa}
        title={t('twoFactorAuth')}
        message={t('confirmDisable2Fa')}
        icon={<AlertTriangle size={24} />}
      />
      
      {showRateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold">{t('addRate')}</h3>
              <button onClick={() => setShowRateModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddRate} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">{t('rateTitle') || 'Title'}</label>
                  <input type="text" value={newRateTitle} onChange={e => setNewRateTitle(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Platinum 950" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">{t('rateKey') || 'Key'}</label>
                  <input type="text" value={newRateKey} onChange={e => setNewRateKey(e.target.value)} className="w-full p-2 border rounded-lg font-mono text-sm" placeholder="platinum" required />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">{t('rateValue') || 'Value'}</label>
                  <input type="number" value={newRateValue} onChange={e => setNewRateValue(e.target.value)} className="w-full p-2 border rounded-lg" step="any" required />
               </div>
               <div className="relative">
                  <label className="block text-sm font-medium mb-1">{t('icon') || 'Icon'}</label>
                  <button type="button" onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)} className="w-full p-2 border rounded-lg flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                       {React.createElement(AVAILABLE_ICONS[newRateIcon] || Coins, { size: 18 })}
                       <span>{newRateIcon}</span>
                    </div>
                    <ChevronDown size={14}/>
                  </button>
                  {isIconDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto p-1 grid grid-cols-2 gap-1">
                      {Object.keys(AVAILABLE_ICONS).map(icon => (
                        <button key={icon} type="button" onClick={() => { setNewRateIcon(icon); setIsIconDropdownOpen(false); }} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded text-sm">
                          {React.createElement(AVAILABLE_ICONS[icon], { size: 16 })}
                          <span>{icon}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <button type="submit" disabled={isSavingRates} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">
                 {isSavingRates ? 'Saving...' : t('addRate')}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
