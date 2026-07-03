import { useRef, useState } from 'react';
import { t } from '../lib/i18n.js';

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
      className={`shrink-0 touch-none select-none rounded-full p-3 transition ${
        recording ? 'animate-pulse bg-red-500/80 text-white' : 'bg-night-700 text-slate-300 hover:bg-night-600'
      } disabled:opacity-40`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
      </svg>
    </button>
  );
}
