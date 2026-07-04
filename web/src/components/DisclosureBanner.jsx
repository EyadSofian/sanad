import { t } from '../lib/i18n.js';

/** Persistent AI-disclosure banner (spec Section 0.1) — always visible, never dismissible. */
export default function DisclosureBanner({ locale }) {
  return (
    <div className="w-full border-b border-sand-200 bg-sand-100/90 px-3 py-1.5 text-center text-[11px] leading-4 text-ink-soft">
      {t(locale, 'disclosureBanner')}
    </div>
  );
}
