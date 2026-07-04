import { useEffect, useRef, useState } from 'react';
import { fetchSpeech } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { IconSpeaker, IconStop } from './Icons.jsx';

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
      className="cursor-pointer rounded-full p-1 text-ink-faint transition hover:bg-sand-100 hover:text-palm disabled:animate-pulse"
    >
      {state === 'playing' ? <IconStop size={13} /> : <IconSpeaker size={13} />}
    </button>
  );
}
