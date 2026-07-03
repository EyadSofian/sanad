import { t } from '../lib/i18n.js';

/** Persistent AI-disclosure banner (spec Section 0.1) — always visible, never dismissible. */
export default function DisclosureBanner({ locale }) {
  return (
    <div className="w-full bg-night-800/90 border-b border-night-600 px-3 py-1.5 text-center text-[11px] leading-4 text-slate-400">
      {t(locale, 'disclosureBanner')}
    </div>
  );
}
