import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/auth';
import { Lock, Bell, Calculator, Save, Plus, Trash2, ArrowRight, AlertTriangle, Coins, DollarSign, Gem, Landmark, Bitcoin, Banknote, CreditCard, Wallet, CircleDollarSign, ChevronDown, Euro, PoundSterling, JapaneseYen, RussianRuble, IndianRupee, TrendingUp, BarChart3, PieChart, Activity, Briefcase, Building2, Vault, PiggyBank, Factory, Warehouse, Container, Plane, Ship, Tractor, User, Settings as SettingsIcon, X, GripVertical } from 'lucide-react';
import { AssetType } from '../types';
import { ASSET_LABELS } from '../constants';
import { CustomDatePicker } from './DatePicker';
import { ConfirmModal } from './ConfirmModal';

export const SettingsPage: React.FC = () => {
    const { t, dir } = useLanguage();
    const { data, updateZakatConfig, addPriceAlert, removePriceAlert, addRate, removeRate, reorderRates } = useStore();
    const { user } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState<'profile' | 'config' | 'alerts' | 'rates'>('profile');
    const [draggedRateId, setDraggedRateId] = useState<number | null>(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

    // Zakat Config State
    const [zakatDate, setZakatDate] = useState(data.zakatConfig?.zakatDate || '');
    const [reminderEnabled, setReminderEnabled] = useState(data.zakatConfig?.reminderEnabled || false);
    const [email, setEmail] = useState(data.zakatConfig?.email || '');
    const [zakatMsg, setZakatMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSubmittingZakat, setIsSubmittingZakat] = useState(false);

    // Price Alert State
    const [newAlertAsset, setNewAlertAsset] = useState<AssetType>('GOLD');
    const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
    const [newAlertPrice, setNewAlertPrice] = useState('');
    const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);

    const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
    const [isDeletingAlert, setIsDeletingAlert] = useState(false);

    // Rates Management
    // For rates we only edit EGP fields for now unless dynamic
    const [newRateKey, setNewRateKey] = useState('');
    const [newRateValue, setNewRateValue] = useState('');
    const [newRateTitle, setNewRateTitle] = useState('');
    const [newRateIcon, setNewRateIcon] = useState('Coins');
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
    const [showRateModal, setShowRateModal] = useState(false);
    const [isSavingRates, setIsSavingRates] = useState(false);
    const [msgRates, setMsgRates] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const AVAILABLE_ICONS: Record<string, any> = {
        Coins, DollarSign, Gem, Landmark, Bitcoin, Banknote, CreditCard, Wallet, CircleDollarSign,
        Euro, PoundSterling, JapaneseYen, RussianRuble, IndianRupee,
        TrendingUp, BarChart3, PieChart, Activity,
        Briefcase, Building2, Vault, PiggyBank, Factory, Warehouse, Container, Plane, Ship, Tractor
    };

    // Handlers
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
                setPwdMessage({ type: 'success', text: t('pwdUpdated') });
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
            // Since updateZakatConfig now returns promise
            await updateZakatConfig({ zakatDate, reminderEnabled, email });
            setZakatMsg({ type: 'success', text: t('saveSuccess') });
        } catch (e: any) {
            setZakatMsg({ type: 'error', text: t('configSaveError') });
        } finally {
            setIsSubmittingZakat(false);
        }
    };

    const handleAddAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlertPrice) return;

        setIsSubmittingAlert(true);
        try {
            const newAlert = {
                id: Date.now().toString(),
                assetType: newAlertAsset,
                condition: newAlertCondition,
                targetPrice: parseFloat(newAlertPrice),
                isActive: true
            };

            await addPriceAlert(newAlert);
            setNewAlertPrice('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingAlert(false);
        }
    };

    const handleDeleteAlert = async () => {
        if (deleteAlertId) {
            setIsDeletingAlert(true);
            try {
                await removePriceAlert(deleteAlertId);
                setDeleteAlertId(null);
            } catch (error) {
                console.error(error);
            } finally {
                setIsDeletingAlert(false);
            }
        }
    };

    const handleSaveRates = async (newRates: any) => {
        setIsSavingRates(true);
        setMsgRates(null);
        try {
            try {
                // Updated to iterate array for bulk update if preserving this feature, 
                // but for now we just support single add/remove or we need to update logic.
                // Assuming this was for 'manual update' of values, which might need array iteration.
                // Since we are moving to single add/remove, let's disable bulk update or fix it?
                // The prompt asks to apply changes for new GET api/rates.
                // Let's assume handleSaveRates is for the old modal which we might not use or need to adapt.
                // I'll leave it but commented out or minimal as we focus on Manage Rates list which uses add/remove.
                // await updateRates({ ...data.rates, ...newRates, lastUpdated: Date.now() });
                // setMsgRates({ type: 'success', text: t('saveSuccess') || 'Rates updated' });
            } catch (e) {
                setMsgRates({ type: 'error', text: 'Failed to update rates' });
            } finally {
                setIsSavingRates(false);
            }
        } catch (e) {
            setMsgRates({ type: 'error', text: 'Failed to update rates' });
        } finally {
            setIsSavingRates(false);
        }
    };

    const handleAddRate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRateKey || !newRateValue) return;
        const val = parseFloat(newRateValue);
        if (isNaN(val)) return;

        // Use new addRate function
        setIsSavingRates(true);
        setMsgRates(null);
        addRate(newRateKey, val, newRateIcon, newRateTitle)
            .then(success => {
                if (success) {
                    setMsgRates({ type: 'success', text: t('rateAdded') });
                    setNewRateKey('');
                    setNewRateValue('');
                    setNewRateTitle('');
                    setNewRateIcon('Coins');
                    setShowRateModal(false);
                } else {
                    setMsgRates({ type: 'error', text: t('rateAddError') });
                }
            })
            .catch(() => setMsgRates({ type: 'error', text: t('rateAddError') }))
            .finally(() => setIsSavingRates(false));
    };

    const handleDeleteRate = (id: number) => {
        setIsSavingRates(true);
        setMsgRates(null);
        removeRate(id)
            .then(success => {
                if (success) {
                    setMsgRates({ type: 'success', text: t('rateRemoved') });
                } else {
                    setMsgRates({ type: 'error', text: t('rateRemoveError') });
                }
            })
            .catch(() => setMsgRates({ type: 'error', text: t('rateRemoveError') }))
            .finally(() => setIsSavingRates(false));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
        setDraggedRateId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
        e.preventDefault();
        const sourceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (sourceId !== targetId) {
            const currentRates = [...data.rates];
            const sourceIndex = currentRates.findIndex(r => r.id === sourceId);
            const targetIndex = currentRates.findIndex(r => r.id === targetId);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const [movedRate] = currentRates.splice(sourceIndex, 1);
                currentRates.splice(targetIndex, 0, movedRate);

                const newOrder = currentRates.map((r, index) => ({
                    id: r.id,
                    order: index + 1
                }));

                reorderRates(newOrder);
            }
        }
    };

    const handleDragEnd = () => {
        setDraggedRateId(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('settings')}</h2>
                <p className="text-slate-500">{t('settingsSubtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                {(['profile', 'config', 'alerts', 'rates'] as const).map(tab => {
                    const icons = {
                        profile: User,
                        config: SettingsIcon,
                        alerts: Bell,
                        rates: Coins
                    };
                    const Icon = icons[tab];
                    const labelKey = `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${isActive
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <Icon size={18} />
                            {t(labelKey as any)}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="mt-2 min-h-[400px]">
                {activeTab === 'profile' && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-emerald-600" />
                            {t('changePassword')}
                        </h3>

                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('currentPassword')}</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('newPassword')}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirmPassword')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            {pwdMessage && (
                                <div className={`text-sm ${pwdMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {pwdMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmittingPwd}
                                className={`px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors ${isSubmittingPwd ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmittingPwd ? 'Updating...' : t('updatePassword')}
                            </button>
                        </form>
                    </section>
                )}

                {activeTab === 'config' && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calculator size={20} className="text-emerald-600" />
                            {t('zakatConfig')}
                        </h3>

                        <div className="space-y-6 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('zakatDueDate')}</label>
                                <CustomDatePicker value={zakatDate} onChange={setZakatDate} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('emailAddress')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="reminder"
                                    checked={reminderEnabled}
                                    onChange={e => setReminderEnabled(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="reminder" className="text-slate-700">{t('enableReminder')}</label>
                            </div>

                            {zakatMsg && (
                                <div className={`text-sm ${zakatMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {zakatMsg.text}
                                </div>
                            )}

                            <button
                                onClick={handleZakatSave}
                                disabled={isSubmittingZakat}
                                className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 ${isSubmittingZakat ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Save size={18} />
                                {isSubmittingZakat ? 'Saving...' : t('saveConfig')}
                            </button>
                        </div>
                    </section>
                )}

                {activeTab === 'alerts' && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-emerald-600" />
                            {t('priceAlerts')}
                        </h3>

                        {/* List Alerts */}
                        <div className="space-y-3 mb-6">
                            {data.priceAlerts.length === 0 && (
                                <p className="text-slate-400 italic text-sm">{t('noAlerts')}</p>
                            )}
                            {data.priceAlerts.map(alert => (
                                <div key={alert.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={18} className="text-amber-500" />
                                        <div>
                                            <span className="font-semibold text-slate-700">{t(`asset_${alert.assetType}` as any)}</span>
                                            <span className="mx-2 text-slate-400 text-sm">
                                                {alert.condition === 'ABOVE' ? '>' : '<'}
                                            </span>
                                            <span className="font-mono font-bold text-slate-900">{alert.targetPrice}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteAlertId(alert.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Alert Form */}
                        <form onSubmit={handleAddAlert} className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-slate-500 mb-1">{t('asset')}</label>
                                <select
                                    value={newAlertAsset}
                                    onChange={e => setNewAlertAsset(e.target.value as AssetType)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    {data.rates.map(rate => (
                                        <option key={rate.key} value={rate.key}>
                                            {rate.title || t(`asset_${rate.key}` as any)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs font-medium text-slate-500 mb-1">{t('condition')}</label>
                                <select
                                    value={newAlertCondition}
                                    onChange={e => setNewAlertCondition(e.target.value as any)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    <option value="ABOVE">{t('above')}</option>
                                    <option value="BELOW">{t('below')}</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs font-medium text-slate-500 mb-1">{t('targetPrice')}</label>
                                <input
                                    type="number"
                                    value={newAlertPrice}
                                    onChange={e => setNewAlertPrice(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                    step="any"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingAlert}
                                className={`p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${isSubmittingAlert ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Plus size={24} />
                            </button>
                        </form>

                    </section>
                )}

                {activeTab === 'rates' && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Coins size={20} className="text-emerald-600" />
                                {t('manageRates') || 'Manage Market Rates'}
                            </h3>
                            <button
                                onClick={() => setShowRateModal(true)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} />
                                {t('addRate') || 'Add Rate'}
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            {/* List current rates (exclude metadata) */}
                            {/* List current rates (array) */}
                            {data.rates.map(rate => {
                                const IconComp = AVAILABLE_ICONS[rate.icon] || Coins;

                                return (
                                    <div
                                        key={rate.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, rate.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, rate.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all ${draggedRateId === rate.id ? 'opacity-50 border-emerald-300 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                                                <GripVertical size={20} />
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100">
                                                {React.createElement(IconComp, { size: 20, className: "text-emerald-600" })}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{rate.title || rate.key}</p>
                                                <p className="text-sm text-slate-500">{rate.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-900">{typeof rate.value === 'number' ? rate.value.toLocaleString() : String(rate.value)}</span>
                                            <button onClick={() => handleDeleteRate(rate.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {msgRates && (
                            <div className={`mt-4 text-sm ${msgRates.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {msgRates.text}
                            </div>
                        )}
                    </section>
                )}


            </div>

            {/* Rate Modal */}
            {showRateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">{t('addRate') || 'Add Market Rate'}</h3>
                            <button onClick={() => setShowRateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddRate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('rateTitle') || 'Title (Optional)'}</label>
                                <input
                                    type="text"
                                    value={newRateTitle}
                                    onChange={e => setNewRateTitle(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. Platinum 950"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('rateKey') || 'Rate Key'}</label>
                                <input
                                    type="text"
                                    value={newRateKey}
                                    onChange={e => setNewRateKey(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                                    placeholder="e.g. platinum_egp"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Unique identifier (e.g. platinum_egp)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('rateValue') || 'Value'}</label>
                                <input
                                    type="number"
                                    value={newRateValue}
                                    onChange={e => setNewRateValue(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                    step="any"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('icon') || 'Icon'}</label>
                                <button
                                    type="button"
                                    onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                                    className="w-full p-2 border rounded-lg bg-white flex items-center justify-between hover:border-emerald-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {React.createElement(AVAILABLE_ICONS[newRateIcon] || Coins, { size: 18, className: "text-emerald-600" })}
                                        <span className="text-sm text-slate-700">{newRateIcon}</span>
                                    </div>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </button>

                                {isIconDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        <div className="p-1 grid grid-cols-1 gap-1">
                                            {Object.keys(AVAILABLE_ICONS).map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewRateIcon(icon);
                                                        setIsIconDropdownOpen(false);
                                                    }}
                                                    className={`flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 w-full text-left transition-colors ${newRateIcon === icon ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                                                >
                                                    {React.createElement(AVAILABLE_ICONS[icon], { size: 18 })}
                                                    <span className="text-sm">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRateModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingRates}
                                    className={`px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 ${isSavingRates ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSavingRates ? 'Saving...' : (t('addRate') || 'Add Rate')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteAlertId}
                onClose={() => setDeleteAlertId(null)}
                onConfirm={handleDeleteAlert}
                title={t('deleteAlertTitle')}
                message={t('deleteAlertBody')}
            />
        </div >
    );
};
