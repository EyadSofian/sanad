import { t } from '../lib/i18n.js';

const STYLES = {
  JARVIS: 'text-jarvis border-jarvis/30 bg-jarvis-tint',
  FRIDAY: 'text-friday border-friday/30 bg-friday-tint',
  TARS: 'text-tars border-tars/30 bg-tars-tint',
  CASE: 'text-case border-case/30 bg-case-tint',
  CRISIS: 'text-crisis border-crisis/30 bg-crisis-tint',
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
