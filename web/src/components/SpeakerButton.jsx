import { useEffect, useRef, useState } from 'react';
import { fetchSpeech } from '../lib/api.js';
import { t } from '../lib/i18n.js';

/**
 * Per-message TTS button (spec Section 9): ElevenLabs mp3, silent fallback to
 * browser speechSynthesis when budget is out or the provider fails.
 */
export default function SpeakerButton({ messageId, content, locale }) {
  const [state, setState] = useState('idle'); // idle | loading | playing
  const audioRef = useRef(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    },
    []
  );

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setState('idle');
  };

  const speakWithBrowser = () => {
    if (!window.speechSynthesis) return setState('idle');
    const utter = new SpeechSynthesisUtterance(content);
    utter.lang = locale === 'en' ? 'en-US' : 'ar-EG';
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('idle');
    window.speechSynthesis.speak(utter);
    setState('playing');
  };

  const play = async () => {
    if (state === 'playing') return stop();
    setState('loading');
    try {
      const result = await fetchSpeech(messageId);
      if (result.fallback) return speakWithBrowser();
      const url = URL.createObjectURL(result.audio);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setState('idle');
      };
      audio.onerror = () => setState('idle');
      await audio.play();
      setState('playing');
    } catch {
      // any failure → browser voice, silently (spec Section 2 error handling)
      speakWithBrowser();
    }
  };

  return (
    <button
      onClick={play}
      disabled={state === 'loading'}
      title={state === 'playing' ? t(locale, 'stop') : t(locale, 'listen')}
      aria-label={state === 'playing' ? t(locale, 'stop') : t(locale, 'listen')}
      className="rounded-full p-1 text-slate-500 transition hover:bg-night-700 hover:text-slate-300 disabled:animate-pulse"
    >
      {state === 'playing' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
        </svg>
      )}
    </button>
  );
}
