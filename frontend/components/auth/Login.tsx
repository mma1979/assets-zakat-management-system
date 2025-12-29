import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, ShieldCheck, KeyRound, Smartphone } from 'lucide-react';
import { getTrustToken } from '../../services/auth';

export const Login: React.FC = () => {
  const { login, loginWithPin, verify2Fa, isLoading, error } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show2Fa, setShow2Fa] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  
  const [rememberDevice, setRememberDevice] = useState(false);
  const [pin, setPin] = useState('');
  const [isPinLogin, setIsPinLogin] = useState(false);
  const [trustToken, setTrustToken] = useState<string | null>(null);

  useEffect(() => {
    if (email && email.includes('@')) {
      const token = getTrustToken(email);
      if (token) {
        setTrustToken(token);
        setIsPinLogin(true);
      } else {
        setIsPinLogin(false);
        setTrustToken(null);
      }
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isPinLogin && trustToken) {
        await loginWithPin(email, pin, trustToken);
        navigate('/app');
        return;
      }

      const result = await login(email, password);
      if (result.twoFactorRequired) {
        setShow2Fa(true);
        setChallengeToken(result.challengeToken || null);
      } else {
        navigate('/app');
      }
    } catch (e) {
      // Error handled in context
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    try {
      await verify2Fa(twoFaCode, email, challengeToken, rememberDevice, rememberDevice ? pin : undefined);
      navigate('/app');
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            {show2Fa ? <ShieldCheck size={24} /> : isPinLogin ? <KeyRound size={24} /> : <LogIn size={24} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {show2Fa ? t('verify2FaTitle') || 'Two-Factor Authentication' : isPinLogin ? 'Quick PIN Login' : t('loginTitle')}
          </h1>
          <p className="text-slate-500 mt-2">
            {show2Fa ? t('verify2FaSubtitle') || 'Enter the 6-digit code from your authenticator app' : isPinLogin ? 'Enter your 4-digit PIN for ' + email : t('loginSubtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!show2Fa ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                dir="ltr"
              />
            </div>

            {isPinLogin ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">4-Digit PIN</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-3 text-center text-2xl tracking-[1em] font-mono rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  dir="ltr"
                  placeholder="••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setIsPinLogin(false); setPin(''); }}
                  className="mt-2 text-xs text-emerald-600 hover:underline"
                >
                  Login with password instead
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  dir="ltr"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('loginButton')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2Fa} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('otpCode') || 'Authentication Code'}</label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                value={twoFaCode}
                onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full p-4 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                dir="ltr"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                    Trust this device for 30 days
                  </span>
                  <span className="text-xs text-slate-500">Skips 2FA on next login</span>
                </div>
              </label>

              {rememberDevice && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Smartphone size={12} /> Set Login PIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN"
                    className="w-full p-3 text-center text-xl tracking-[0.5em] font-mono rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 text-center">
                    If set, you can login with this PIN instead of your password.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || twoFaCode.length < 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('verifyButton') || 'Verify'}
            </button>
            
            <button
              type="button"
              onClick={() => setShow2Fa(false)}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-all"
            >
              ← {t('backToLogin') || 'Back to Login'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          {t('noAccount')} <Link to="/register" className="text-emerald-600 font-semibold hover:underline">{t('registerButton')}</Link>
        </div>
      </div>
    </div>
  );
};
