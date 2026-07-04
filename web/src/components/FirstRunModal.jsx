import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-6 shadow-lift"
      >
        <h2 className="mb-3 font-display text-lg font-bold text-ink">{t(locale, 'firstRunTitle')}</h2>
        <p className="mb-3 text-sm leading-6 text-ink-soft">{t(locale, 'firstRunBody')}</p>
        <p className="mb-5 rounded-xl bg-sand-100 p-3 text-xs leading-5 text-ink-faint">
          {locale === 'ar' ? t('en', 'disclosureBanner') : t('ar', 'disclosureBanner')}
        </p>
        <button
          onClick={ack}
          className="w-full cursor-pointer rounded-xl bg-palm py-2.5 font-semibold text-white transition hover:bg-palm-deep active:scale-[0.98]"
        >
          {t(locale, 'firstRunAgree')}
        </button>
      </motion.div>
    </div>
  );
}
