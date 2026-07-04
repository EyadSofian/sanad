import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { IconMic } from './Icons.jsx';

/**
 * Hold-to-talk mic (spec Sections 9 + 11): records webm/opus with MediaRecorder,
 * hands the blob up on release. Under ~400ms is treated as an accidental tap.
 */
export default function MicButton({ onAudio, disabled, locale }) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);

  const start = async (e) => {
    e.preventDefault();
    if (disabled || recording || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => ev.data.size && chunksRef.current.push(ev.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const longEnough = Date.now() - startedAtRef.current > 400;
        if (longEnough && chunksRef.current.length) {
          onAudio(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }));
        }
      };
      recRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
    } catch {
      /* mic permission denied — nothing to do */
    }
  };

  const stopRec = () => {
    if (!recording) return;
    recRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stopRec}
      onPointerLeave={stopRec}
      onContextMenu={(e) => e.preventDefault()}
      title={recording ? t(locale, 'recording') : t(locale, 'holdToTalk')}
      aria-label={t(locale, 'holdToTalk')}
      className={`relative shrink-0 cursor-pointer touch-none select-none rounded-full p-3 transition ${
        recording
          ? 'bg-clay text-white'
          : 'bg-sand-100 text-ink-soft hover:bg-sand-200 hover:text-ink'
      } disabled:opacity-40`}
    >
      {recording && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-clay"
          animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeOut' }}
        />
      )}
      <IconMic size={17} />
    </button>
  );
}
