import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsAPI, MemoryAPI, MeAPI, DigestAPI } from '../lib/api.js';
import { useAuth, useLocale } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';
import { IconBack, IconSparkle } from '../components/Icons.jsx';

const ENGINE_LABELS = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
};

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
      <h2 className="mb-4 font-display text-sm font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const locale = useLocale();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // {locale, tarsHonesty, tarsHumor, ttsEnabled, ttsUsage, engine}
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
    return <div className="p-8 text-center text-sm text-ink-faint">{t(locale, 'loading')}</div>;
  }

  const usageRatio = form.ttsUsage?.budget ? Math.min(1, form.ttsUsage.used / form.ttsUsage.budget) : 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="cursor-pointer rounded-lg p-1.5 text-ink-soft transition hover:bg-sand-100 hover:text-ink"
            aria-label={t(locale, 'back')}
          >
            <IconBack size={18} />
          </Link>
          <h1 className="font-display text-lg font-bold text-ink">{t(locale, 'settings')}</h1>
          <span className="flex-1" />
          <span className="text-xs text-ink-faint" dir="ltr">
            {form.email}
          </span>
        </div>

        <Section title={t(locale, 'language')}>
          <div className="flex gap-2">
            {['ar', 'en'].map((loc) => (
              <button
                key={loc}
                onClick={() => save({ locale: loc })}
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm transition active:scale-[0.97] ${
                  form.locale === loc
                    ? 'bg-palm font-semibold text-white'
                    : 'bg-sand-100 text-ink-soft hover:bg-sand-200'
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
              <span className="mb-1.5 flex justify-between text-xs text-ink-soft">
                <span>{t(locale, label)}</span>
                <span className="font-mono font-semibold text-tars">{form[key]}%</span>
              </span>
              <input type="range" min="0" max="100" value={form[key]} onChange={(e) => save({ [key]: Number(e.target.value) })} />
            </label>
          ))}
        </Section>

        <Section title={t(locale, 'tts')}>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-ink-soft">{t(locale, 'tts')}</span>
            <input
              type="checkbox"
              checked={form.ttsEnabled}
              onChange={(e) => save({ ttsEnabled: e.target.checked })}
              className="h-5 w-5 accent-palm"
            />
          </label>
          {form.ttsUsage && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-ink-faint">
                <span>{t(locale, 'ttsUsage')}</span>
                <span dir="ltr" className="font-mono">
                  {Math.round(form.ttsUsage.used)} / {form.ttsUsage.budget}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sand-200">
                <div
                  className={`h-full rounded-full transition-all ${usageRatio >= 0.8 ? 'bg-tars' : 'bg-case'}`}
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
            </div>
          )}
        </Section>

        {form.engine && (
          <Section title={t(locale, 'engine')}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-soft">{ENGINE_LABELS[form.engine.provider] || form.engine.provider}</span>
              <span dir="ltr" className="rounded-lg border border-palm/25 bg-palm-tint px-2.5 py-1 font-mono text-[11px] text-palm">
                {form.engine.model}
              </span>
            </div>
          </Section>
        )}

        <Section title={t(locale, 'memory')}>
          {facts.length === 0 ? (
            <p className="text-xs leading-5 text-ink-faint">{t(locale, 'memoryEmpty')}</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2">
                  <div>
                    <span className="me-2 rounded-md bg-sand-200 px-1.5 py-0.5 text-[10px] text-ink-soft">{f.category}</span>
                    <span className="text-xs leading-5 text-ink-soft">{f.fact}</span>
                  </div>
                  <button
                    onClick={() => removeFact(f.id)}
                    className="shrink-0 cursor-pointer text-[11px] text-red-500 hover:text-red-600"
                  >
                    {t(locale, 'deleteFact')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t(locale, 'digest')}>
          {digest ? (
            <div className="rounded-xl border border-tars/25 bg-tars-tint/40 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-tars">
                <IconSparkle size={14} />
                <span className="text-[11px] font-semibold">{t(locale, 'weekMirror')}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{digest.content}</p>
            </div>
          ) : (
            <p className="text-xs leading-5 text-ink-faint">{t(locale, 'digestEmpty')}</p>
          )}
        </Section>

        <Section title={t(locale, 'dangerZone')}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="cursor-pointer rounded-xl bg-sand-100 px-4 py-2 text-sm text-ink-soft transition hover:bg-sand-200 active:scale-[0.98]"
            >
              {t(locale, 'logout')}
            </button>
            <button
              onClick={deleteAccount}
              className="cursor-pointer rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
            >
              {t(locale, 'deleteAccount')}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
