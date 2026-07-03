import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';

const GUEST_LOCALE_KEY = 'sanad_locale_guest';

function useGuestLocale() {
  const [locale, setLocale] = useState(() => localStorage.getItem(GUEST_LOCALE_KEY) || 'ar');
  const toggle = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    localStorage.setItem(GUEST_LOCALE_KEY, next);
    setLocale(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };
  return [locale, toggle];
}

function AuthShell({ locale, toggleLocale, title, children }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <button onClick={toggleLocale} className="mb-6 rounded-full border border-night-600 px-3 py-1 text-xs text-slate-400 hover:text-slate-200">
        {locale === 'ar' ? 'English' : 'العربية'}
      </button>
      <div className="mb-2 text-4xl font-bold text-jarvis">{t(locale, 'appName')}</div>
      <p className="mb-1 text-sm text-slate-400">{t(locale, 'tagline')}</p>
      <p className="mb-8 max-w-sm text-center text-[11px] leading-5 text-slate-500">{t(locale, 'disclosureBanner')}</p>
      <div className="w-full max-w-sm rounded-2xl border border-night-600 bg-night-800 p-6 shadow-xl">
        <h1 className="mb-5 text-lg font-semibold text-slate-100">{title}</h1>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-night-600 bg-night-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-jarvis/60 focus:outline-none';

export function LoginPage() {
  const [locale, toggleLocale] = useGuestLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || t(locale, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell locale={locale} toggleLocale={toggleLocale} title={t(locale, 'login')}>
      <form onSubmit={submit} className="space-y-3">
        <input dir="ltr" type="email" required placeholder={t(locale, 'email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input dir="ltr" type="password" required placeholder={t(locale, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-jarvis/90 py-2.5 font-semibold text-night-950 transition hover:bg-jarvis disabled:opacity-50">
          {busy ? t(locale, 'loading') : t(locale, 'login')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        {t(locale, 'noAccount')}{' '}
        <Link to="/signup" className="text-jarvis hover:underline">
          {t(locale, 'signup')}
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const [locale, toggleLocale] = useGuestLocale();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // 18+ age gate — required, stored server-side (spec Section 0.4)
      await signup({ email, password, locale, isAdultConfirmed: adult });
      navigate('/');
    } catch (err) {
      setError(err.message || t(locale, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell locale={locale} toggleLocale={toggleLocale} title={t(locale, 'signup')}>
      <form onSubmit={submit} className="space-y-3">
        <input dir="ltr" type="email" required placeholder={t(locale, 'email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input dir="ltr" type="password" required minLength={8} placeholder={t(locale, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-300">
          <input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-jarvis" />
          {t(locale, 'ageGate')}
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button disabled={busy || !adult} className="w-full rounded-xl bg-jarvis/90 py-2.5 font-semibold text-night-950 transition hover:bg-jarvis disabled:opacity-50">
          {busy ? t(locale, 'loading') : t(locale, 'signup')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        {t(locale, 'haveAccount')}{' '}
        <Link to="/login" className="text-jarvis hover:underline">
          {t(locale, 'login')}
        </Link>
      </p>
    </AuthShell>
  );
}
