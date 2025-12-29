import React, { useMemo, useEffect, useState } from 'react';
import { StoreData, ZakatCalculationResult } from '../types';
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE } from '../constants';
import { AlertTriangle, CheckCircle, Info, CalendarClock, ArrowRight, Bell, BellRing, Mail, Coins, ArrowDown, Gem, Receipt } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { addDays, format, isBefore, isAfter, isSameDay, differenceInDays } from 'date-fns';
import { useStore } from '../services/storage';
import { CustomDatePicker } from './DatePicker';
import { ZakatPaymentManager } from './ZakatPaymentManager';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface ZakatCalculatorProps {
  data: StoreData;
}

// Helper to replace parseISO (treats yyyy-mm-dd as local time)
const parseLocal = (dateStr: string) => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2].split('T')[0]));
  }
  return new Date(dateStr);
};

const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

export const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({ data }) => {
  const { t, language, dir } = useLanguage();
  const { updateZakatConfig, fetchZakatCalculation, isSyncing, addZakatPayment, removeZakatPayment } = useStore();
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverCalculation, setServerCalculation] = useState<ZakatCalculationResult | null>(null);

  // Zakat Calculation Configuration
  const zakatDate = data.zakatConfig?.zakatDate || format(new Date(), 'yyyy-MM-dd');
  const reminderEnabled = data.zakatConfig?.reminderEnabled || false;
  const userEmail = data.zakatConfig?.email || '';





  const handleDateChange = (value: string) => {
    updateZakatConfig({
      ...data.zakatConfig,
      zakatDate: value,
      reminderEnabled: data.zakatConfig?.reminderEnabled
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateZakatConfig({
      ...data.zakatConfig,
      zakatDate: zakatDate, // keep existing
      email: e.target.value
    });
  };

  // Reminder Logic
  const toggleReminder = async () => {
    if (!reminderEnabled) {
      if (!('Notification' in window)) {
        alert("This browser does not support desktop notification");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateZakatConfig({
          ...data.zakatConfig,
          zakatDate,
          email: userEmail,
          reminderEnabled: true,
          baseCurrency: data.zakatConfig?.baseCurrency || 'EGP'
        });
        // Test notification
        new Notification("ZakatVault", { body: t('reminderActive') });
      } else {
        alert(t('permDenied'));
      }
    } else {
      updateZakatConfig({
        ...data.zakatConfig,
        zakatDate,
        email: userEmail,
        reminderEnabled: false,
        baseCurrency: data.zakatConfig?.baseCurrency || 'EGP'
      });
    }
  };


  useEffect(() => {
    if (!isSyncing) {
      fetchZakatCalculation().then(setServerCalculation).catch(console.error);
    }
  }, [fetchZakatCalculation, zakatDate, data.transactions, data.liabilities, data.zakatPayments, isSyncing]);

  const clientCalculation = useMemo(() => {
    // 0. Time Windows
    let startDate = parseLocal(zakatDate);
    if (!isValidDate(startDate)) {
      startDate = new Date();
    }
    const lunarYearDays = 355; // Approx lunar year
    const lunarEndDate = addDays(startDate, lunarYearDays);

    // 1. Calculate Total Assets Value (Market Value)
    const holdings: Record<string, number> = {};

    // Initialize for all known rates + baseCurr
    const baseCurr = data.zakatConfig?.baseCurrency || 'EGP';
    data.rates.forEach(r => holdings[r.key] = 0);
    holdings[baseCurr] = 0;

    data.transactions.forEach(tx => {
      if (holdings[tx.assetType] === undefined) holdings[tx.assetType] = 0;
      if (tx.type === 'BUY') holdings[tx.assetType] += tx.amount;
      else holdings[tx.assetType] -= tx.amount;
    });

    const getRate = (k: string) => data.rates.find(r => r.key === k)?.value || 0;

    // Sum value of all assets (excluding EGP handled separately or as rate=1)
    let assetValue = 0;

    // 1. Add Value of all Rated Assets
    data.rates.forEach(rate => {
      const qty = holdings[rate.key] || 0;
      assetValue += qty * rate.value;
    });

    // 2. Add base currency cash
    assetValue += holdings[baseCurr] || 0;

    // 2. Deduct Liabilities (Within Lunar Year Window)
    const deductibleLiabilities = data.liabilities
      .filter(l => {
        if (!l.isDeductible) return false;

        // Check date logic
        if (!l.dueDate) return false;

        const due = parseLocal(l.dueDate);
        if (!isValidDate(due)) return false;

        // Logic: Is the due date ON or AFTER the Zakat Date AND BEFORE or ON the Lunar End Date?
        // Basically: due \in [zakatDate, zakatDate + 354]
        const isOnOrAfterStart = isAfter(due, startDate) || isSameDay(due, startDate);
        const isOnOrBeforeEnd = isBefore(due, lunarEndDate) || isSameDay(due, lunarEndDate);

        return isOnOrAfterStart && isOnOrBeforeEnd;
      })
      .reduce((sum, l) => sum + l.amount, 0);

    const zakatBase = Math.max(0, assetValue - deductibleLiabilities);

    // 3. Nisab Thresholds


    const nisabGoldValue = NISAB_GOLD_GRAMS * getRate('GOLD');
    const nisabSilverValue = NISAB_SILVER_GRAMS * getRate('SILVER');

    const isEligible = zakatBase >= nisabGoldValue;

    const zakatDue = isEligible ? zakatBase * ZAKAT_RATE : 0;

    return {
      assetValue,
      deductibleLiabilities,
      zakatBase,
      nisabGoldValue,
      nisabSilverValue,
      isEligible,
      zakatDue,
      lunarEndDate
    };
  }, [data.transactions, data.liabilities, data.rates, zakatDate]);

  const calculation = useMemo(() => {
    return {
      assetValue: serverCalculation?.totalAssets ?? 0,
      deductibleLiabilities: serverCalculation?.totalDebts ?? 0,
      zakatBase: serverCalculation?.netZakatBase ?? 0,
      nisabGoldValue: serverCalculation?.nisabGoldValue ?? 0,
      nisabSilverValue: serverCalculation?.nisabSilverValue ?? 0,
      zakatDue: serverCalculation?.totalZakatDue ?? 0,
      totalPayments: serverCalculation?.totalPayments ?? 0,
      remainingZakatDue: serverCalculation?.remainingZakatDue ?? 0,
      lunarEndDate: serverCalculation?.lunarEndDate ?? '2026-07-23',
      isEligible: (serverCalculation?.totalZakatDue ?? 0) > 0,
    };
  }, [serverCalculation]);

  const remainingDays = useMemo(() => {

    const endDateStr = zakatDate;
    // It might be a string or Date depending on source
    // parseLocal handles string 'YYYY-MM-DD'. If it's a Date object, wrapping in new Date() works or check type.
    // Assuming string based on Step 125 edits '2026-07-23'

    let due: Date;
    // Check if it looks like a Date object safely
    if (Object.prototype.toString.call(endDateStr) === '[object Date]') {
      due = endDateStr as unknown as Date;
    } else {
      due = parseLocal(String(endDateStr));
    }

    if (!isValidDate(due)) return NaN;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return differenceInDays(due, today);
  }, [calculation.lunarEndDate]);

  const remainingText = useMemo(() => {
    if (isNaN(remainingDays)) return "";
    if (remainingDays > 0) return `${remainingDays} ${t('daysRemaining')}`;
    if (remainingDays === 0) return t('dueToday');
    return `${Math.abs(remainingDays)} ${t('daysOverdue')}`;
  }, [remainingDays, t]);

  const baseCurrency = data.zakatConfig?.baseCurrency || 'EGP';
  const formatWithCurrency = (val: number) => formatCurrency(val, baseCurrency, language);
  const formatWithNumber = (val: number) => formatNumber(val, language);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">{t('zakatTitle')}</h2>
        <p className="text-slate-500 mt-2">{t('zakatSubtitle')}</p>
      </div>

      {/* Date Configuration */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('zakatDueDate')}</h3>
            <p className="text-sm text-slate-500">{t('lunarYearWindow')}</p>
          </div>
        </div>

        <div className="w-full flex flex-wrap gap-4 items-center">
          {/* Date Input */}
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-1 min-w-[250px]">
            <CustomDatePicker
              value={zakatDate}
              onChange={handleDateChange}
              className="flex-1"
              disabled={true}
            />
            {dir === 'rtl' ? <ArrowRight className="text-slate-300 hidden sm:block" size={16} transform="scale(-1, 1)" /> : <ArrowRight className="text-slate-300 hidden sm:block" size={16} />}
            <div className="text-center px-2 hidden sm:block">
              <div className={`text-xs font-bold uppercase ${remainingDays < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {remainingText}
              </div>
              <div className="text-sm font-bold text-slate-700" dir="ltr">{calculation.lunarEndDate}</div>
            </div>
          </div>

          {/* Email Input */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-1 min-w-[250px]">
            <Mail size={18} className="text-slate-400 ms-2" />
            <input
              type="email"
              value={userEmail}
              onChange={handleEmailChange}
              placeholder={t('emailAddress')}
              className="bg-transparent border-none outline-none text-sm w-full p-1"
              dir="ltr"
            />
            {emailStatus === 'sent' && <span className="text-xs text-emerald-600 px-2">{t('emailSent')}</span>}
            {emailStatus === 'error' && <span className="text-xs text-rose-600 px-2">{t('emailFailed')}</span>}
          </div>

          {/* Reminder Button */}
          <button
            onClick={toggleReminder}
            title={reminderEnabled ? t('reminderActive') : t('enableReminder')}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border ${reminderEnabled
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-200'
              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            {reminderEnabled ? <BellRing size={20} /> : <Bell size={20} />}
          </button>
        </div>
      </div>

      <ZakatPaymentManager 
        payments={data.zakatPayments}
        onAddPayment={addZakatPayment}
        onRemovePayment={removeZakatPayment}
        isSyncing={isSyncing}
      />

      {/* Result Card */}
      <div className={`p-8 rounded-3xl text-center border-2 transition-colors duration-300 ${calculation.isEligible
        ? 'bg-emerald-600 border-emerald-500 text-white'
        : 'bg-white border-slate-200 text-slate-800'
        }`}>
        <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-4">
          {calculation.isEligible ? <CheckCircle size={40} className="text-white" /> : <Info size={40} className="text-slate-400" />}
        </div>
        <h3 className={`text-lg font-medium ${calculation.isEligible ? 'text-emerald-100' : 'text-slate-500'}`}>
          {t('remainingZakatDue')}
        </h3>
        <div className="text-5xl font-bold my-4 tracking-tight">
          {formatWithCurrency(calculation.remainingZakatDue)}
        </div>
        {calculation.totalPayments > 0 && (
          <div className="text-sm opacity-80 mb-2">
            {t('totalZakatDue')}: {formatWithCurrency(calculation.zakatDue)} | {t('paid')}: {formatWithCurrency(calculation.totalPayments)}
          </div>
        )}
        <p className={`max-w-md mx-auto ${calculation.isEligible ? 'text-emerald-100' : 'text-slate-400'}`}>
          {calculation.isEligible ? t('eligibleMsg') : t('notEligibleMsg')}
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Info size={18} className="text-blue-500" /> {t('calcDetails')}
          </h4>

          <div className="flex flex-col gap-4">
            {/* 1. Total Assets */}
            <div className="relative p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Coins size={20} />
                </div>
                <span className="text-sm font-medium text-slate-600">{t('totalAssets')}</span>
              </div>
              <span className="font-bold text-lg text-emerald-700">{formatWithNumber(calculation.assetValue)} <span className="text-xs">{baseCurrency}</span></span>
            </div>

            {/* Operator: Minus */}
            <div className="flex justify-center -my-2 z-10">
              <div className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400">
                <ArrowDown size={16} strokeWidth={3} />
              </div>
            </div>

            {/* 2. Liabilities */}
            <div className="relative p-4 rounded-xl bg-rose-50 border border-rose-100 flex justify-between items-center group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <ArrowDown size={20} />
                </div>
                <span className="text-sm font-medium text-slate-600">{t('lessDebts')}</span>
              </div>
              <span className="font-bold text-lg text-rose-700">
                {calculation.deductibleLiabilities > 0 ? '-' : ''}{formatWithNumber(calculation.deductibleLiabilities)} <span className="text-xs">{baseCurrency}</span>
              </span>
            </div>

            {/* Operator: Equals */}
            <div className="flex justify-center -my-2 z-10">
              <div className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400">
                <ArrowDown size={16} strokeWidth={3} />
              </div>
            </div>

            {/* 3. Net Base */}
            <div className="relative p-4 rounded-xl bg-blue-50 border border-blue-100 flex justify-between items-center shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Gem size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700">{t('netZakatBase')}</span>
              </div>
              <span className="font-bold text-xl text-blue-700">{formatWithNumber(calculation.zakatBase)} <span className="text-xs">{baseCurrency}</span></span>
            </div>

            {/* Operator: Equal for Zakat Due */}
            <div className="flex justify-center -my-2 z-10">
              <div className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400">
                <ArrowDown size={16} strokeWidth={3} />
              </div>
            </div>

            {/* 4. Total Zakat Due */}
            <div className="relative p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
                  <Info size={20} />
                </div>
                <span className="text-sm font-medium text-slate-600">{t('totalZakatDue')}</span>
              </div>
              <span className="font-bold text-lg text-slate-700">{formatWithNumber(calculation.zakatDue)} <span className="text-xs">{baseCurrency}</span></span>
            </div>

            {/* Operator: Minus for Payments */}
            <div className="flex justify-center -my-2 z-10">
              <div className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400">
                <ArrowDown size={16} strokeWidth={3} />
              </div>
            </div>

            {/* 5. Total Payments */}
            <div className="relative p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Receipt size={20} />
                </div>
                <span className="text-sm font-medium text-slate-600">{t('totalPayments')}</span>
              </div>
              <span className="font-bold text-lg text-emerald-700">-{formatWithNumber(calculation.totalPayments)} <span className="text-xs">{baseCurrency}</span></span>
            </div>

            {/* 4. Result Explanation */}
            <div className="mt-2 text-center">
              <p className="text-xs text-slate-400">
                {calculation.isEligible
                  ? `${t('zakatDueBody')} (${formatWithNumber(ZAKAT_RATE * 100)}%)`
                  : t('notEligibleMsg')
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> {t('nisabThresholds')}
          </h4>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-amber-800 font-semibold mb-1">{t('goldNisab')}</div>
              <div className="text-2xl font-bold text-amber-900">{formatWithNumber(calculation.nisabGoldValue)} {baseCurrency}</div>
              <div className="text-xs text-amber-700 mt-1">@ {formatWithNumber(data.rates.find(r => r.key === 'GOLD')?.value || 0)} {baseCurrency}/g</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-75">
              <div className="text-slate-600 font-semibold mb-1">{t('silverNisab')}</div>
              <div className="text-xl font-bold text-slate-700">{formatWithNumber(calculation.nisabSilverValue)} {baseCurrency}</div>
              <div className="text-xs text-slate-500 mt-1">@ {formatWithNumber(data.rates.find(r => r.key === 'SILVER')?.value || 0)} {baseCurrency}/g</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};