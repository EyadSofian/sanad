import { t } from '../lib/i18n.js';

const STYLES = {
  JARVIS: 'text-jarvis border-jarvis/40 bg-jarvis/10',
  FRIDAY: 'text-friday border-friday/40 bg-friday/10',
  TARS: 'text-tars border-tars/40 bg-tars/10',
  CASE: 'text-case border-case/40 bg-case/10',
  CRISIS: 'text-crisis border-crisis/40 bg-crisis/10',
};

const LABELS = {
  ar: { JARVIS: 'جارفيس', FRIDAY: 'فرايدي', TARS: 'تارس', CASE: 'كيس', CRISIS: 'الأمان' },
  en: { JARVIS: 'JARVIS', FRIDAY: 'FRIDAY', TARS: 'TARS', CASE: 'CASE', CRISIS: 'SAFETY' },
};

/** Persona indicator chip + "why this mode" tooltip (spec Section 11). */
export default function PersonaChip({ persona, locale }) {
  if (!persona || !STYLES[persona]) return null;
  const why = t(locale, 'personaWhy')[persona];
  return (
    <span
      title={`${t(locale, 'whyMode')} ${why}`}
      className={`inline-flex cursor-help items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${STYLES[persona]}`}
    >
      {LABELS[locale === 'en' ? 'en' : 'ar'][persona]}
    </span>
  );
}
