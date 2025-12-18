import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/auth';
import { Lock, Bell, Calculator, Save, Plus, Trash2, ArrowRight, AlertTriangle, Coins, DollarSign, Gem, Landmark, Bitcoin, Banknote, CreditCard, Wallet, CircleDollarSign, ChevronDown, Euro, PoundSterling, JapaneseYen, RussianRuble, IndianRupee, TrendingUp, BarChart3, PieChart, Activity, Briefcase, Building2, Vault, PiggyBank, Factory, Warehouse, Container, Plane, Ship, Tractor } from 'lucide-react';
import { AssetType } from '../types';
import { ASSET_LABELS } from '../constants';
import { CustomDatePicker } from './DatePicker';
import { ConfirmModal } from './ConfirmModal';

export const SettingsPage: React.FC = () => {
    const { t, dir } = useLanguage();
    const { data, updateZakatConfig, addPriceAlert, removePriceAlert, updateRates } = useStore();
    const { user } = useAuth();

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
    const [newRateIcon, setNewRateIcon] = useState('Coins');
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
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
                setPwdMessage({ type: 'error', text: 'Failed to update password' });
            }
        } catch (error: any) {
            setPwdMessage({ type: 'error', text: error.message || 'Failed to update password' });
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
            setZakatMsg({ type: 'success', text: t('saveSuccess') || 'Configuration saved successfully' });
        } catch (e: any) {
            setZakatMsg({ type: 'error', text: 'Failed to save configuration' });
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
            await updateRates({ ...data.rates, ...newRates, lastUpdated: Date.now() });
            setMsgRates({ type: 'success', text: t('saveSuccess') || 'Rates updated' });
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

        // prepare updates
        const updates: any = { [newRateKey]: val };

        // Handle Icon updates if supported
        if (newRateIcon) {
            const currentIcons = data.rates.rateIcons || {};
            updates.rateIcons = { ...currentIcons, [newRateKey]: newRateIcon };
        }

        handleSaveRates(updates);
        setNewRateKey('');
        setNewRateValue('');
        setNewRateIcon('Coins');
    };

    const handleDeleteRate = (key: string) => {
        // Technically we can't delete from fixed interface, but for dynamic keys we can.
        // For fixed keys, we might just set to 0 or ignore.
        // To truly delete, we need to send the object without that key, but TS interface might complain if mandatory.
        // We will assume dynamic keys can be deleted. Standard keys shouldn't be deleted structurally.
        // For now, let's just create a new object without the key.
        const { [key]: deleted, ...rest } = data.rates as any;
        // We need to call updateRates with the new object
        // updateDataPart merges? No, it replaces.
        // So we need to pass the full object minus the key.
        setIsSavingRates(true);
        setMsgRates(null);
        try {
            // For strict keys in interface, this might be tricky, but we cast to any.
            updateRates({ ...rest, lastUpdated: Date.now() });
            setMsgRates({ type: 'success', text: 'Rate removed' });
        } catch (e) {
            setMsgRates({ type: 'error', text: 'Failed to remove rate' });
        } finally {
            setIsSavingRates(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('settings')}</h2>
                <p className="text-slate-500">{t('settingsSubtitle')}</p>
            </div>

            {/* Change Password Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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

            {/* Zakat Config Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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

            {/* Price Alerts Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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
                            {Object.keys(ASSET_LABELS).map(key => (
                                <option key={key} value={key}>{t(`asset_${key}` as any)}</option>
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

            {/* Manage Rates Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Coins size={20} className="text-emerald-600" />
                    {t('manageRates') || 'Manage Market Rates'}
                </h3>

                <div className="space-y-4 mb-6">
                    {/* List current rates (exclude metadata) */}
                    {Object.entries(data.rates)
                        .filter(([k]) => k !== 'lastUpdated' && k !== 'dataSources' && k !== 'rateIcons')
                        .map(([key, value]) => {
                            const iconName = data.rates.rateIcons?.[key] || 'Coins';
                            const IconComp = AVAILABLE_ICONS[iconName] || Coins;

                            return (
                                <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full border border-slate-100 text-emerald-600">
                                            <IconComp size={18} />
                                        </div>
                                        <span className="font-mono text-slate-700 font-semibold">{key.replace('_egp', '').toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                                        <button onClick={() => handleDeleteRate(key)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                </div>

                <form onSubmit={handleAddRate} className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-[120px] relative">
                        <label className="block text-xs font-medium text-slate-500 mb-1">{t('icon') || 'Icon'}</label>
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
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">{t('rateKey') || 'Rate Key (e.g. platinum_egp)'}</label>
                        <input
                            type="text"
                            value={newRateKey}
                            onChange={e => setNewRateKey(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="asset_currency"
                            required
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">{t('rateValue') || 'Value'}</label>
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
                    <button
                        type="submit"
                        disabled={isSavingRates}
                        className={`p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${isSavingRates ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Plus size={24} />
                    </button>
                </form>

                {msgRates && (
                    <div className={`mt-4 text-sm ${msgRates.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {msgRates.text}
                    </div>
                )}
            </section>

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
