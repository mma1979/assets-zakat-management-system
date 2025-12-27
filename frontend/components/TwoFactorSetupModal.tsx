import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, X, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { setup2Fa, enable2Fa } from '../services/auth';
import { TwoFactorSetupDto } from '../types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorSetupModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { t, dir } = useLanguage();
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState<TwoFactorSetupDto | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSetup = async () => {
      try {
        const data = await setup2Fa();
        setSetupData(data);
      } catch (err) {
        setError(t('setup2FaError') || 'Failed to initialize 2FA setup');
      } finally {
        setIsLoading(false);
      }
    };
    initSetup();
  }, [t]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || code.length < 6) return;

    setIsVerifying(true);
    setError(null);
    try {
      const success = await enable2Fa({
        code,
        secret: setupData.secret
      });

      if (success) {
        setStep(3);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(t('setup2FaError') || 'Invalid code');
      }
    } catch (err) {
      setError(t('setup2FaError') || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir={dir}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <Shield size={24} />
            <h2 className="text-xl font-bold">{t('setup2FaTitle')}</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
              <p className="text-slate-500">{t('loading') || 'Loading...'}</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6 text-center">
              <p className="text-slate-600 text-sm">{t('setup2FaStep1')}</p>
              
              <div className="bg-white p-4 border-2 border-slate-100 rounded-xl inline-block mx-auto">
                {setupData && (
                  <QRCodeSVG value={setupData.qrCodeUri} size={200} includeMargin={true} />
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">Secret Key (Manual Entry):</p>
                <p className="text-sm font-mono font-bold text-slate-700 tracking-wider">
                  {setupData?.secret}
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
              >
                {t('next') || 'Next'}
              </button>
            </div>
          ) : step === 2 ? (
            <form onSubmit={handleVerify} className="space-y-6 text-center">
              <p className="text-slate-600 text-sm">{t('setup2FaStep2')}</p>

              <input
                type="text"
                autoFocus
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full p-4 text-center text-3xl tracking-[0.5em] font-mono rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none transition-all"
              />

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all"
                >
                  {t('back') || 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || code.length < 6}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 className="animate-spin" size={20} /> : t('verifyButton')}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{t('setup2FaSuccess')}</h3>
              <p className="text-slate-500">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
