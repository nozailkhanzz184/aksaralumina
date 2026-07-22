import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, Languages, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useI18n } from '../lib/i18n';

interface Props {
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean>;
  resetPassword?: (email: string) => Promise<boolean>;
  updatePasswordRecovery?: (userId: string, secret: string, newPass: string) => Promise<boolean>;
  verifyEmail?: (userId: string, secret: string) => Promise<boolean>;
  loading: boolean;
}

export const LoginScreen = ({ login, register, resetPassword, updatePasswordRecovery, verifyEmail, loading }: Props) => {
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('userId');
    const sec = params.get('secret');
    const action = params.get('action');
    
    if (uid && sec) {
      if (action === 'verify' && verifyEmail) {
        verifyEmail(uid, sec).then((res) => {
          if (res) setMode('login');
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setUserId(uid);
        setSecret(sec);
        setMode('reset');
        // clear URL safely
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [verifyEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    if (mode === 'login') {
      await login(email, pass);
    } else if (mode === 'register') {
      // Basic security check for password strength
      if (pass.length < 8) {
        alert("Sandi minimal 8 karakter");
        setAuthLoading(false);
        return;
      }
      await register(email, pass);
    } else if (mode === 'forgot' && resetPassword) {
      const res = await resetPassword(email);
      if (res) {
        setMode('login');
      }
    } else if (mode === 'reset' && updatePasswordRecovery) {
       if (pass.length < 8) {
        alert("Sandi minimal 8 karakter");
        setAuthLoading(false);
        return;
      }
      const res = await updatePasswordRecovery(userId, secret, pass);
      if (res) {
        setMode('login');
        setPass('');
      }
    }
    
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  const langs = [
    { id: 'id', label: 'Indonesian' },
    { id: 'en', label: 'English' },
    { id: 'zh-CN', label: '简体中文' },
    { id: 'zh-TW', label: '繁體中文' },
    { id: 'fr', label: 'Français' },
    { id: 'ja', label: '日本語' },
    { id: 'vi', label: 'Tiếng Việt' }
  ];

  const getTitle = () => {
    if (mode === 'login') return t('login.welcome') || 'Selamat Datang';
    if (mode === 'register') return t('login.createAccount') || 'Buat Akun';
    if (mode === 'forgot') return 'Lupa Sandi';
    return 'Reset Sandi';
  };

  const getDesc = () => {
    if (mode === 'login') return t('login.signInDesc') || 'Masuk untuk melanjutkan';
    if (mode === 'register') return t('login.signUpDesc') || 'Daftar untuk melindungi data Anda';
    if (mode === 'forgot') return 'Masukkan email Anda untuk menerima tautan reset (Batas 1 jam sekali)';
    return 'Masukkan sandi baru Anda yang kuat.';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="p-2 bg-white rounded-full shadow-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors border border-neutral-200"
        >
          <Languages size={20} />
        </button>
        {showLangMenu && (
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden py-1">
            {langs.map(l => (
              <button
                key={l.id}
                onClick={() => { setLang(l.id as any); setShowLangMenu(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${lang === l.id ? 'bg-neutral-50 font-medium text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 w-full max-w-[380px] overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in-95 duration-300 relative">
        
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mb-5 shadow-sm ">
            <AppLogo isDark={true} size={32} />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {getTitle()}
          </h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-[260px] leading-relaxed">
            {getDesc()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            
            {mode !== 'reset' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b-2 border-neutral-200 bg-neutral-50/50 rounded-t-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:bg-neutral-50 transition-all"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>
            )}
            
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {mode === 'reset' ? 'Sandi Baru' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full border-b-2 border-neutral-200 bg-neutral-50/50 rounded-t-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:bg-neutral-50 transition-all"
                    placeholder={t('login.min8') || 'Minimal 8 karakter'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={authLoading || (mode !== 'reset' && email.length < 5) || (mode !== 'forgot' && pass.length < 8)}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3.5 px-4 rounded-xl disabled:opacity-70 text-sm transition-transform active:scale-[0.98] mt-2 shadow-md shadow-neutral-900/10"
          >
            {authLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {mode === 'login' ? (t('login.signIn') || 'Masuk') : 
             mode === 'register' ? (t('login.signUp') || 'Daftar') : 
             mode === 'forgot' ? 'Kirim Tautan Reset' : 'Simpan Sandi Baru'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col items-center gap-3">
          {mode === 'login' && (
             <button
              onClick={() => setMode('forgot')}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
             >
               Lupa Sandi?
             </button>
          )}

          {mode !== 'reset' && (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {mode === 'login' 
                ? (t('login.noAccount') || 'Belum punya akun? Daftar') 
                : (t('login.hasAccount') || 'Sudah punya akun? Masuk')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
