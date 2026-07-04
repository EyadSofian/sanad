import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="blob -top-28 -start-24 h-96 w-96 animate-breathe bg-palm-tint" />
      <div className="blob -bottom-24 -end-24 h-80 w-80 animate-breathe bg-clay-tint [animation-delay:2.5s]" />

      <button
        onClick={toggleLocale}
        className="relative z-10 mb-7 cursor-pointer rounded-full border border-sand-300 bg-white/80 px-3.5 py-1.5 text-xs text-ink-soft shadow-card transition hover:text-ink"
      >
        {locale === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="relative z-10 mb-2 font-display text-5xl font-extrabold tracking-tight text-palm">
        {t(locale, 'appName')}
        <span className="text-clay">.</span>
      </div>
      <p className="relative z-10 mb-1 text-sm text-ink-soft">{t(locale, 'tagline')}</p>
      <p className="relative z-10 mb-8 max-w-sm text-center text-[11px] leading-5 text-ink-faint">
        {t(locale, 'disclosureBanner')}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-sand-200 bg-white p-6 shadow-warm"
      >
        <h1 className="mb-5 font-display text-xl font-bold text-ink">{title}</h1>
        {children}
      </motion.div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-palm focus:outline-none focus:ring-2 focus:ring-palm/15';

const primaryBtn =
  'w-full cursor-pointer rounded-xl bg-palm py-2.5 font-semibold text-white transition hover:bg-palm-deep active:scale-[0.98] disabled:opacity-50';

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
    <AuthShell locale={locale} toggleLocale={toggleLocale} title={t(locale, 'loginTitle')}>
      <form onSubmit={submit} className="space-y-3">
        <input dir="ltr" type="email" required placeholder={t(locale, 'email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input dir="ltr" type="password" required placeholder={t(locale, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={busy} className={primaryBtn}>
          {busy ? t(locale, 'loading') : t(locale, 'login')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-soft">
        {t(locale, 'noAccount')}{' '}
        <Link to="/signup" className="font-semibold text-palm hover:underline">
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
    <AuthShell locale={locale} toggleLocale={toggleLocale} title={t(locale, 'signupTitle')}>
      <form onSubmit={submit} className="space-y-3">
        <input dir="ltr" type="email" required placeholder={t(locale, 'email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input dir="ltr" type="password" required minLength={8} placeholder={t(locale, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-ink-soft">
          <input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-palm" />
          {t(locale, 'ageGate')}
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={busy || !adult} className={primaryBtn}>
          {busy ? t(locale, 'loading') : t(locale, 'signup')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-soft">
        {t(locale, 'haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-palm hover:underline">
          {t(locale, 'login')}
        </Link>
      </p>
    </AuthShell>
  );
}
