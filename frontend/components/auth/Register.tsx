import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, isLoading, error } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (e) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
             <UserPlus size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-800">{t('registerTitle')}</h1>
           <p className="text-slate-500 mt-2">{t('registerSubtitle')}</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
            <input 
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
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

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : t('registerButton')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {t('haveAccount')} <Link to="/login" className="text-emerald-600 font-semibold hover:underline">{t('loginButton')}</Link>
        </div>
      </div>
    </div>
  );
};