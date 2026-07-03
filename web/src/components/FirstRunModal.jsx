import { useState } from 'react';
import { t } from '../lib/i18n.js';

const ACK_KEY = 'sanad_disclosure_ack_v1';

/** First-run disclosure modal (spec Section 0.1) — blocks until acknowledged once per device. */
export default function FirstRunModal({ locale }) {
  const [open, setOpen] = useState(() => !localStorage.getItem(ACK_KEY));
  if (!open) return null;

  const ack = () => {
    localStorage.setItem(ACK_KEY, new Date().toISOString());
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-night-600 bg-night-800 p-6 shadow-2xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">{t(locale, 'firstRunTitle')}</h2>
        <p className="mb-3 text-sm leading-6 text-slate-300">{t(locale, 'firstRunBody')}</p>
        <p className="mb-5 rounded-lg bg-night-900 p-3 text-xs leading-5 text-slate-400">
          {locale === 'ar' ? t('en', 'disclosureBanner') : t('ar', 'disclosureBanner')}
        </p>
        <button
          onClick={ack}
          className="w-full rounded-xl bg-jarvis/90 py-2.5 font-semibold text-night-950 transition hover:bg-jarvis"
        >
          {t(locale, 'firstRunAgree')}
        </button>
      </div>
    </div>
  );
}
