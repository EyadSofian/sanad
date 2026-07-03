import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsAPI, MemoryAPI, MeAPI, DigestAPI } from '../lib/api.js';
import { useAuth, useLocale } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-night-700 bg-night-800/60 p-5">
      <h2 className="mb-4 text-sm font-bold text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const locale = useLocale();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // {locale, tarsHonesty, tarsHumor, ttsEnabled, ttsUsage}
  const [facts, setFacts] = useState([]);
  const [digest, setDigest] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await SettingsAPI.get();
        setForm(s);
      } catch {
        /* leave skeleton */
      }
      try {
        const { facts: list } = await MemoryAPI.list();
        setFacts(list);
      } catch {
        /* memory viewer is best-effort */
      }
      try {
        const { digest: d } = await DigestAPI.latest();
        setDigest(d);
      } catch {
        /* optional */
      }
    })();
  }, []);

  // Debounced auto-save (sliders fire many change events)
  const save = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const updated = await SettingsAPI.patch(patch);
        setForm(updated);
        updateUser({ ...user, ...updated });
      } catch {
        /* keep local values; next change retries */
      }
    }, 500);
  };

  const removeFact = async (id) => {
    try {
      await MemoryAPI.remove(id);
      setFacts((prev) => prev.filter((f) => f.id !== id));
    } catch {
      /* row stays */
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t(locale, 'deleteAccountConfirm'))) return;
    try {
      await MeAPI.deleteAccount();
    } finally {
      logout();
      navigate('/login');
    }
  };

  if (!form) {
    return <div className="p-8 text-center text-sm text-slate-500">{t(locale, 'loading')}</div>;
  }

  const usageRatio = form.ttsUsage?.budget ? Math.min(1, form.ttsUsage.used / form.ttsUsage.budget) : 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-lg p-1.5 text-slate-400 hover:bg-night-700 hover:text-slate-200" aria-label="back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="rtl:-scale-x-100" aria-hidden>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-100">{t(locale, 'settings')}</h1>
          <span className="flex-1" />
          <span className="text-xs text-slate-500" dir="ltr">
            {form.email}
          </span>
        </div>

        <Section title={t(locale, 'language')}>
          <div className="flex gap-2">
            {['ar', 'en'].map((loc) => (
              <button
                key={loc}
                onClick={() => save({ locale: loc })}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  form.locale === loc ? 'bg-jarvis/90 font-semibold text-night-950' : 'bg-night-700 text-slate-300 hover:bg-night-600'
                }`}
              >
                {loc === 'ar' ? 'العربية (مصري)' : 'English'}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t(locale, 'tarsSettings')}>
          {[
            ['tarsHonesty', 'honesty'],
            ['tarsHumor', 'humor'],
          ].map(([key, label]) => (
            <label key={key} className="mb-4 block last:mb-0">
              <span className="mb-1.5 flex justify-between text-xs text-slate-400">
                <span>{t(locale, label)}</span>
                <span className="font-mono text-tars">{form[key]}%</span>
              </span>
              <input type="range" min="0" max="100" value={form[key]} onChange={(e) => save({ [key]: Number(e.target.value) })} />
            </label>
          ))}
        </Section>

        <Section title={t(locale, 'tts')}>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-slate-300">{t(locale, 'tts')}</span>
            <input type="checkbox" checked={form.ttsEnabled} onChange={(e) => save({ ttsEnabled: e.target.checked })} className="h-5 w-5 accent-jarvis" />
          </label>
          {form.ttsUsage && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>{t(locale, 'ttsUsage')}</span>
                <span dir="ltr" className="font-mono">
                  {Math.round(form.ttsUsage.used)} / {form.ttsUsage.budget}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-night-600">
                <div
                  className={`h-full rounded-full transition-all ${usageRatio >= 0.8 ? 'bg-tars' : 'bg-case'}`}
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
            </div>
          )}
        </Section>

        <Section title={t(locale, 'memory')}>
          {facts.length === 0 ? (
            <p className="text-xs leading-5 text-slate-500">{t(locale, 'memoryEmpty')}</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 rounded-xl bg-night-900 px-3 py-2">
                  <div>
                    <span className="me-2 rounded bg-night-700 px-1.5 py-0.5 text-[10px] text-slate-400">{f.category}</span>
                    <span className="text-xs leading-5 text-slate-300">{f.fact}</span>
                  </div>
                  <button onClick={() => removeFact(f.id)} className="shrink-0 text-[11px] text-red-400/80 hover:text-red-400">
                    {t(locale, 'deleteFact')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t(locale, 'digest')}>
          {digest ? (
            <div className="whitespace-pre-wrap rounded-xl border border-tars/30 bg-night-900 p-4 text-sm leading-7 text-slate-200">
              {digest.content}
            </div>
          ) : (
            <p className="text-xs leading-5 text-slate-500">{t(locale, 'digestEmpty')}</p>
          )}
        </Section>

        <Section title={t(locale, 'dangerZone')}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-xl bg-night-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-night-600"
            >
              {t(locale, 'logout')}
            </button>
            <button onClick={deleteAccount} className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
              {t(locale, 'deleteAccount')}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
