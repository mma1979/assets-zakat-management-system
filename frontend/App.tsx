
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AssetManager } from './components/AssetManager';
import { LiabilityManager } from './components/LiabilityManager';
import { ZakatCalculator } from './components/ZakatCalculator';
import { SettingsPage } from './components/SettingsPage';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ZakatSetup } from './components/auth/ZakatSetup';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useStore } from './services/storage';
import { fetchMarketRates } from './services/geminiService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ASSET_LABELS } from './constants';

const AuthenticatedApp: React.FC = () => {
  const {
    data,
    isLoaded,
    syncError,
    isSyncing,
    addTransaction,
    removeTransaction,
    addLiability,
    removeLiability,
    addRate,
    updateRates,
    decreaseLiability
  } = useStore();

  const { t } = useLanguage();

  // Auto-update rates if older than 24 hours
  useEffect(() => {
    // Check if we have rates and if the first one is old (assuming sync)
    // Actually we probably need a smarter way or just check any.
    if (isLoaded && data.rates.length > 0) {
      const lastUpdatedStr = data.rates[0].lastUpdated;
      const lastUpdated = lastUpdatedStr ? new Date(lastUpdatedStr).getTime() : 0;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const elapsed = now - lastUpdated;

      if (elapsed > oneDay) {
        console.log("Market rates expired (>24h). Fetching updates...");
        fetchMarketRates(data.rates)
          .then(newRates => {
            // We need to save these rates back to the server/store
            updateRates(newRates);
          })
          .catch(err => {
            console.error("Auto-update of rates failed:", err);
          });
      }
    }
  }, [isLoaded, data.rates]);

  // Check Price Alerts
  useEffect(() => {
    if (isLoaded && data.rates && data.priceAlerts && data.priceAlerts.length > 0) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const triggeredAlerts = data.priceAlerts.filter(alert => {
        const rate = data.rates.find(r => r.key === alert.assetType);
        if (!rate) return false;
        const currentPrice = rate.value;

        if (currentPrice <= 0) return false;

        const isHit = alert.condition === 'ABOVE'
          ? currentPrice > alert.targetPrice
          : currentPrice < alert.targetPrice;

        return isHit;
      });

      triggeredAlerts.forEach(alert => {
        // Debounce: Check if we already notified for this specific alert value session
        const alertKey = `alert_${alert.id}_${alert.targetPrice}`;
        const hasNotified = sessionStorage.getItem(alertKey);

        if (!hasNotified) {
          const assetName = t(`asset_${alert.assetType}` as any);
          // Find rate for body
          const rateVal = data.rates.find(r => r.key === alert.assetType)?.value || 0;
          const body = `${assetName} ${t('alertHitBody')} ${rateVal} EGP`;

          new Notification(t('alertHitTitle'), { body, icon: '/favicon.ico' });
          sessionStorage.setItem(alertKey, 'true');
        }
      });
    }
  }, [data.rates, data.priceAlerts, isLoaded, t]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500 gap-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Connecting to ZakatVault...</p>
      </div>
    );
  }

  return (
    <Layout>
      {/* Sync Status / Error Banner */}
      <div className="fixed bottom-20 md:bottom-8 start-4 z-50 flex flex-col items-start gap-2 pointer-events-none">
        {syncError && (
          <div className="bg-amber-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in pointer-events-auto flex items-center gap-2 max-w-xs">
            <span>⚠️ {t('syncError')}</span>
          </div>
        )}
        {isSyncing && (
          <div className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium opacity-80 animate-pulse">
            {t('syncing')}
          </div>
        )}
      </div>

      <Routes>
        <Route path="/" element={<Dashboard data={data} onUpdateRates={updateRates} />} />
        <Route
          path="/assets"
          element={
            <AssetManager
              data={data}
              onAddTransaction={addTransaction}
              onRemoveTransaction={removeTransaction}
            />
          }
        />
        <Route
          path="/liabilities"
          element={
            <LiabilityManager
              data={data}
              onAddLiability={addLiability}
              onRemoveLiability={removeLiability}
              onDecreaseLiability={decreaseLiability}
            />
          }
        />
        <Route path="/zakat" element={<ZakatCalculator data={data} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

import { LandingPage } from './components/LandingPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/zakat-setup" element={<ZakatSetup />} />
        <Route path="/app/*" element={<AuthenticatedApp />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </HashRouter>
  );
};

export default App;
