import React, { useMemo, useEffect, useState } from 'react';
import { StoreData } from '../types';
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE } from '../constants';
import { AlertTriangle, CheckCircle, Info, CalendarClock, ArrowRight, Bell, BellRing, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { addDays, format, isBefore, isAfter, isSameDay } from 'date-fns';
import { useStore } from '../services/storage';
import { sendZakatReminderEmail } from '../services/notificationService';

interface ZakatCalculatorProps {
  data: StoreData;
}

// Helper to replace parseISO (treats yyyy-mm-dd as local time)
const parseLocal = (dateStr: string) => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
};

const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

export const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({ data }) => {
  const { t, language, dir } = useLanguage();
  const { updateZakatConfig } = useStore();
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  
  // Zakat Calculation Configuration
  const zakatDate = data.zakatConfig?.zakatDate || format(new Date(), 'yyyy-MM-dd');
  const reminderEnabled = data.zakatConfig?.reminderEnabled || false;
  const userEmail = data.zakatConfig?.email || '';
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateZakatConfig({ 
      ...data.zakatConfig,
      zakatDate: e.target.value,
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
          zakatDate,
          email: userEmail,
          reminderEnabled: true 
        });
        // Test notification
        new Notification("ZakatVault", { body: t('reminderActive') });
      } else {
        alert(t('permDenied'));
      }
    } else {
      updateZakatConfig({ 
        zakatDate,
        email: userEmail,
        reminderEnabled: false 
      });
    }
  };

  // Check for reminder on mount/update
  useEffect(() => {
    if (reminderEnabled && zakatDate) {
      const today = new Date();
      const due = parseLocal(zakatDate);
      
      // Simple check: Is today the day?
      if (isSameDay(today, due)) {
        // Prevent spamming
        const lastSent = sessionStorage.getItem('zakatNotificationSent');
        const todayStr = format(today, 'yyyy-MM-dd');

        if (lastSent !== todayStr) {
          // 1. Browser Notification
          if ('Notification' in window && Notification.permission === 'granted') {
             new Notification(t('zakatDueTitle'), {
              body: t('zakatDueBody'),
              icon: '/favicon.ico'
            });
          }

          // 2. Email Notification
          if (userEmail && emailStatus === 'idle') {
            setEmailStatus('sending');
            sendZakatReminderEmail(userEmail, zakatDate)
              .then(result => {
                if (result.success) {
                   console.log("Email sent successfully");
                   setEmailStatus('sent');
                } else {
                   console.error("Email failed", result.message);
                   setEmailStatus('error');
                }
              });
          }
          
          sessionStorage.setItem('zakatNotificationSent', todayStr);
        }
      }
    }
  }, [reminderEnabled, zakatDate, userEmail, t, emailStatus]);

  const calculation = useMemo(() => {
    // 0. Time Windows
    const startDate = parseLocal(zakatDate);
    const lunarYearDays = 354; // Approx lunar year
    const lunarEndDate = addDays(startDate, lunarYearDays);

    // 1. Calculate Total Assets Value (Market Value)
    const holdings: Record<string, number> = { GOLD: 0, GOLD_21: 0, SILVER: 0, USD: 0, EGP: 0 };
    data.transactions.forEach(tx => {
      if (tx.type === 'BUY') holdings[tx.assetType] += tx.amount;
      else holdings[tx.assetType] -= tx.amount;
    });

    const assetValue = 
      (holdings.GOLD * data.rates.gold_egp) +
      (holdings.GOLD_21 * (data.rates.gold21_egp || 0)) +
      (holdings.SILVER * data.rates.silver_egp) +
      (holdings.USD * data.rates.usd_egp) +
      holdings.EGP;

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
    const nisabGoldValue = NISAB_GOLD_GRAMS * data.rates.gold_egp;
    const nisabSilverValue = NISAB_SILVER_GRAMS * data.rates.silver_egp;
    
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
  }, [data, zakatDate]);

  const formatCurrency = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP' });
  const formatNum = (val: number) => (val ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG');

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
                <input 
                   type="date" 
                   value={zakatDate}
                   onChange={handleDateChange}
                   className="bg-white p-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 w-full"
                />
                {dir === 'rtl' ? <ArrowRight className="text-slate-300 hidden sm:block" size={16} transform="scale(-1, 1)" /> : <ArrowRight className="text-slate-300 hidden sm:block" size={16} />}
                <div className="text-center px-2 hidden sm:block">
                   <div className="text-xs text-slate-400 font-medium uppercase">{t('days354')}</div>
                   <div className="text-sm font-bold text-slate-700" dir="ltr">{format(calculation.lunarEndDate, 'yyyy-MM-dd')}</div>
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
               className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border ${
                 reminderEnabled 
                   ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-200' 
                   : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
               }`}
             >
               {reminderEnabled ? <BellRing size={20} /> : <Bell size={20} />}
             </button>
         </div>
      </div>

      {/* Result Card */}
      <div className={`p-8 rounded-3xl text-center border-2 transition-colors duration-300 ${
        calculation.isEligible 
          ? 'bg-emerald-600 border-emerald-500 text-white' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-4">
          {calculation.isEligible ? <CheckCircle size={40} className="text-white"/> : <Info size={40} className="text-slate-400"/>}
        </div>
        <h3 className={`text-lg font-medium ${calculation.isEligible ? 'text-emerald-100' : 'text-slate-500'}`}>
          {t('totalZakatDue')}
        </h3>
        <div className="text-5xl font-bold my-4 tracking-tight">
          {formatCurrency(calculation.zakatDue)}
        </div>
        <p className={`max-w-md mx-auto ${calculation.isEligible ? 'text-emerald-100' : 'text-slate-400'}`}>
          {calculation.isEligible ? t('eligibleMsg') : t('notEligibleMsg')}
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Info size={18} className="text-blue-500"/> {t('calcDetails')}
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-2 rounded hover:bg-slate-50">
              <span className="text-slate-500">{t('totalAssets')}</span>
              <span className="font-semibold">{formatNum(calculation.assetValue)} EGP</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-slate-50 text-rose-600">
              <div className="flex flex-col">
                 <span>{t('lessDebts')}</span>
                 <span className="text-[10px] text-rose-400">
                   {format(parseLocal(zakatDate), 'dd MMM')} - {format(calculation.lunarEndDate, 'dd MMM')}
                 </span>
              </div>
              <span className="font-semibold">({formatNum(calculation.deductibleLiabilities)} EGP)</span>
            </div>
            <div className="border-t border-dashed border-slate-200 my-2"></div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="font-bold text-slate-700">{t('netZakatBase')}</span>
              <span className="font-bold text-slate-900">{formatNum(calculation.zakatBase)} EGP</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500"/> {t('nisabThresholds')}
          </h4>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-amber-800 font-semibold mb-1">{t('goldNisab')}</div>
              <div className="text-2xl font-bold text-amber-900">{formatNum(calculation.nisabGoldValue)} EGP</div>
              <div className="text-xs text-amber-700 mt-1">@ {formatNum(data.rates.gold_egp)} EGP/g</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-75">
              <div className="text-slate-600 font-semibold mb-1">{t('silverNisab')}</div>
              <div className="text-xl font-bold text-slate-700">{formatNum(calculation.nisabSilverValue)} EGP</div>
              <div className="text-xs text-slate-500 mt-1">@ {formatNum(data.rates.silver_egp)} EGP/g</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};