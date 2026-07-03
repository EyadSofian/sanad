import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SessionsAPI, streamChat } from '../lib/api.js';
import { useAuth, useLocale } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';
import MessageBubble from '../components/MessageBubble.jsx';
import CrisisCard from '../components/CrisisCard.jsx';
import MicButton from '../components/MicButton.jsx';

let tempId = 0;
const nextTempId = () => `tmp-${++tempId}`;

export default function ChatPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [crisisResources, setCrisisResources] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  const refreshSessions = useCallback(async () => {
    try {
      const { sessions: list } = await SessionsAPI.list();
      setSessions(list);
    } catch {
      /* sidebar is best-effort */
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const newChat = () => {
    setSessionId(null);
    setMessages([]);
    setCrisisResources(null);
    setSidebarOpen(false);
  };

  const openSession = async (id) => {
    setSidebarOpen(false);
    try {
      const { messages: list } = await SessionsAPI.messages(id);
      setSessionId(id);
      setCrisisResources(null);
      setMessages(
        list.map((m) => ({ id: m.id, role: m.role, persona: m.persona, content: m.content, streaming: false }))
      );
    } catch {
      /* keep current view */
    }
  };

  const send = async ({ text, audio }) => {
    if (sending) return;
    const trimmed = (text || '').trim();
    if (!trimmed && !audio) return;

    setSending(true);
    setInput('');
    const userMsg = {
      id: nextTempId(),
      role: 'user',
      content: trimmed || (locale === 'ar' ? '🎤 رسالة صوتية' : '🎤 voice message'),
      streaming: false,
    };
    const placeholder = { id: nextTempId(), role: 'assistant', persona: null, content: '', streaming: true };
    setMessages((prev) => [...prev, userMsg, placeholder]);

    const patchPlaceholder = (patch) =>
      setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? { ...m, ...patch } : m)));

    try {
      await streamChat({
        text: trimmed || undefined,
        audio,
        sessionId,
        onEvent: (event, data) => {
          if (event === 'meta') {
            setSessionId(data.sessionId);
            patchPlaceholder({ persona: data.persona });
            if (data.newSession) {
              // AI disclosure repeated at every new session start (spec Section 0.2)
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === userMsg.id);
                const note = { id: nextTempId(), role: 'system', content: t(locale, 'disclosureSession') };
                return idx === -1 ? [note, ...prev] : [...prev.slice(0, idx), note, ...prev.slice(idx)];
              });
            }
          } else if (event === 'crisis_resources') {
            setCrisisResources(data);
          } else if (event === 'delta') {
            setMessages((prev) =>
              prev.map((m) => (m.id === placeholder.id ? { ...m, content: m.content + data.text } : m))
            );
          } else if (event === 'done') {
            patchPlaceholder({ id: data.messageId, content: data.content, streaming: false });
          } else if (event === 'error') {
            patchPlaceholder({ content: t(locale, 'errorGeneric'), streaming: false });
          }
        },
      });
    } catch {
      patchPlaceholder({ content: t(locale, 'errorGeneric'), streaming: false });
    } finally {
      setSending(false);
      refreshSessions();
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send({ text: input });
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="flex min-h-0 flex-1">
      {/* sessions sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-y-0 start-0 z-40 w-72 shadow-2xl' : 'hidden'
        } flex-col border-e border-night-700 bg-night-900 md:static md:flex md:w-64`}
      >
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-semibold text-slate-300">{t(locale, 'sessions')}</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-500 md:hidden" aria-label="close">
            ✕
          </button>
        </div>
        <button
          onClick={newChat}
          className="mx-3 mb-3 rounded-xl border border-jarvis/40 bg-jarvis/10 py-2 text-sm font-semibold text-jarvis transition hover:bg-jarvis/20"
        >
          + {t(locale, 'newChat')}
        </button>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openSession(s.id)}
              className={`block w-full rounded-lg px-3 py-2 text-start text-xs transition hover:bg-night-800 ${
                s.id === sessionId ? 'bg-night-800 text-slate-200' : 'text-slate-400'
              }`}
            >
              <span className="mb-0.5 block text-[10px] text-slate-500">{fmtDate(s.startedAt)}</span>
              <span className="line-clamp-2 leading-4">{s.summary || t(locale, 'newChat')}</span>
            </button>
          ))}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* chat column */}
      <main className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-night-700 bg-night-900/80 px-4 py-2.5 backdrop-blur">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-slate-400 md:hidden" aria-label="menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </button>
          <span className="text-lg font-bold text-jarvis">{t(locale, 'appName')}</span>
          <span className="flex-1" />
          <Link to="/settings" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-night-700 hover:text-slate-200" title={t(locale, 'settings')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.61.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54a7.03 7.03 0 0 0 1.63-.94l2.39.96c.21.1.48.01.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
            </svg>
          </Link>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {crisisResources && <CrisisCard resources={crisisResources} locale={locale} />}
            {messages.length === 0 && (
              <div className="mt-16 text-center text-sm leading-7 text-slate-500">
                <div className="mb-2 text-3xl">☁️</div>
                {t(locale, 'tagline')}
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} locale={locale} ttsEnabled={Boolean(user?.ttsEnabled)} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-night-700 bg-night-900/80 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <MicButton locale={locale} disabled={sending} onAudio={(blob) => send({ audio: blob })} />
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send({ text: input });
                }
              }}
              placeholder={crisisResources ? t(locale, 'crisisInputHint') : t(locale, 'typeMessage')}
              className="max-h-40 min-h-[46px] flex-1 resize-none rounded-2xl border border-night-600 bg-night-800 px-4 py-3 text-[15px] text-slate-100 placeholder:text-slate-500 focus:border-jarvis/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-full bg-jarvis/90 p-3 text-night-950 transition hover:bg-jarvis disabled:opacity-40"
              aria-label={t(locale, 'send')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="rtl:-scale-x-100" aria-hidden>
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
