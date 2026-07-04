import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SessionsAPI, DigestAPI } from '../lib/api.js';
import { useLocale } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';
import {
  IconSun,
  IconMoon,
  IconChat,
  IconList,
  IconScale,
  IconWind,
  IconSettings,
  IconSparkle,
  IconArrow,
} from '../components/Icons.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
};

function greetingKey(hour) {
  if (hour < 5) return 'greetNight';
  if (hour < 12) return 'greetMorning';
  if (hour < 17) return 'greetNoon';
  if (hour < 22) return 'greetEvening';
  return 'greetNight';
}

export default function HomePage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const [lastSession, setLastSession] = useState(null);
  const [digest, setDigest] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { sessions } = await SessionsAPI.list();
        setLastSession(sessions.find((s) => s.summary) || sessions[0] || null);
      } catch {
        /* best-effort */
      }
      try {
        const { digest: d } = await DigestAPI.latest();
        setDigest(d);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const GreetIcon = hour >= 5 && hour < 17 ? IconSun : IconMoon;
  const dateLabel = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const modes = [
    {
      key: 'JARVIS',
      Icon: IconChat,
      cls: 'border-jarvis/25 bg-jarvis-tint text-jarvis',
      title: t(locale, 'modeJarvisTitle'),
      sub: t(locale, 'modeJarvisSub'),
      go: () => navigate('/chat'),
    },
    {
      key: 'FRIDAY',
      Icon: IconList,
      cls: 'border-friday/25 bg-friday-tint text-friday',
      title: t(locale, 'modeFridayTitle'),
      sub: t(locale, 'modeFridaySub'),
      go: () => navigate('/chat', { state: { prefill: t(locale, 'prefillFriday') } }),
    },
    {
      key: 'TARS',
      Icon: IconScale,
      cls: 'border-tars/25 bg-tars-tint text-tars',
      title: t(locale, 'modeTarsTitle'),
      sub: t(locale, 'modeTarsSub'),
      go: () => navigate('/chat', { state: { prefill: t(locale, 'prefillTars') } }),
    },
    {
      key: 'CASE',
      Icon: IconWind,
      cls: 'border-case/25 bg-case-tint text-case',
      title: t(locale, 'modeCaseTitle'),
      sub: t(locale, 'modeCaseSub'),
      go: () => navigate('/chat', { state: { say: t(locale, 'sayCase') } }),
    },
  ];

  const sendMood = (mood) => {
    navigate('/chat', { state: { say: t(locale, 'moodSend').replace('{mood}', mood) } });
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="relative mx-auto max-w-2xl px-5 pb-16 pt-5">
        {/* organic backdrop */}
        <div className="blob -top-24 -start-28 h-80 w-80 animate-drift bg-palm-tint" />
        <div className="blob top-24 -end-20 h-64 w-64 animate-drift bg-clay-tint [animation-delay:3s]" />

        {/* header */}
        <header className="relative z-10 flex items-center justify-between">
          <div className="font-display text-2xl font-extrabold tracking-tight text-palm">
            {t(locale, 'appName')}
            <span className="text-clay">.</span>
          </div>
          <Link
            to="/settings"
            className="rounded-full border border-sand-200 bg-white/70 p-2.5 text-ink-soft shadow-card transition hover:text-ink"
            aria-label={t(locale, 'settings')}
          >
            <IconSettings size={18} />
          </Link>
        </header>

        {/* greeting */}
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="relative z-10 mt-8">
          <p className="text-xs font-medium text-ink-faint">{dateLabel}</p>
          <h1 className="mt-1.5 flex items-center gap-2.5 font-display text-3xl font-bold text-ink">
            {t(locale, greetingKey(hour))}
            <span className="text-clay">
              <GreetIcon size={26} />
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">{t(locale, 'howToday')}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {t(locale, 'moods').map((mood, i) => (
              <motion.button
                key={mood}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={i + 1}
                onClick={() => sendMood(mood)}
                className="cursor-pointer rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-soft shadow-card transition hover:border-palm/40 hover:text-palm active:scale-[0.97]"
              >
                {mood}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* mode cards */}
        <section className="relative z-10 mt-9">
          <h2 className="mb-3 font-display text-sm font-bold text-ink-soft">{t(locale, 'spacesTitle')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modes.map((m, i) => (
              <motion.button
                key={m.key}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={i + 2}
                onClick={m.go}
                className="group cursor-pointer rounded-2xl border border-sand-200 bg-white p-4 text-start shadow-card transition hover:shadow-warm active:scale-[0.98]"
              >
                <span className={`inline-flex rounded-xl border p-2.5 ${m.cls}`}>
                  <m.Icon size={20} />
                </span>
                <span className="mt-3 block font-display text-[15px] font-bold text-ink">{m.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-ink-soft">{m.sub}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* continue last conversation */}
        {lastSession && (
          <motion.section variants={fadeUp} initial="hidden" animate="show" custom={6} className="relative z-10 mt-6">
            <button
              onClick={() => navigate('/chat', { state: { sessionId: lastSession.id } })}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-start shadow-card transition hover:shadow-warm active:scale-[0.99]"
            >
              <span className="rounded-xl border border-palm/25 bg-palm-tint p-2.5 text-palm">
                <IconChat size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-ink">{t(locale, 'continueTitle')}</span>
                <span className="mt-0.5 line-clamp-1 block text-xs text-ink-soft">
                  {lastSession.summary || fmtDate(lastSession.startedAt)}
                </span>
              </span>
              <span className="text-ink-faint transition group-hover:text-palm">
                <IconArrow size={18} />
              </span>
            </button>
          </motion.section>
        )}

        {/* weekly digest */}
        {digest && (
          <motion.section variants={fadeUp} initial="hidden" animate="show" custom={7} className="relative z-10 mt-6">
            <div className="rounded-2xl border border-tars/25 bg-white p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-tars">
                <IconSparkle size={16} />
                <span className="font-display text-sm font-bold">{t(locale, 'weekMirror')}</span>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-6 text-ink-soft">{digest.content}</p>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
