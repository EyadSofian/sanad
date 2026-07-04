import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SessionsAPI, streamChat } from '../lib/api.js';
import { useAuth, useLocale } from '../lib/auth.jsx';
import { t } from '../lib/i18n.js';
import MessageBubble from '../components/MessageBubble.jsx';
import CrisisCard from '../components/CrisisCard.jsx';
import MicButton from '../components/MicButton.jsx';
import { IconHome, IconMenu, IconPlus, IconSend, IconSettings, IconX } from '../components/Icons.jsx';

let tempId = 0;
const nextTempId = () => `tmp-${++tempId}`;

export default function ChatPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [crisisResources, setCrisisResources] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const bootRef = useRef(false);

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
      content: trimmed || t(locale, 'voiceNote'),
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

  // Entry intents from the Home screen: open a session, auto-send, or prefill.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const st = location.state || {};
    if (st.sessionId) openSession(st.sessionId);
    else if (st.say) send({ text: st.say });
    else if (st.prefill) {
      setInput(st.prefill);
      inputRef.current?.focus();
    }
  }, []); // boot-once by design: entry intent is consumed a single time

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
          sidebarOpen ? 'fixed inset-y-0 start-0 z-40 w-72 shadow-lift' : 'hidden'
        } flex-col border-e border-sand-200 bg-white md:static md:flex md:w-64`}
      >
        <div className="flex items-center justify-between p-3">
          <span className="font-display text-sm font-bold text-ink-soft">{t(locale, 'sessions')}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="cursor-pointer rounded-lg p-1 text-ink-faint hover:text-ink md:hidden"
            aria-label={t(locale, 'close')}
          >
            <IconX size={16} />
          </button>
        </div>
        <button
          onClick={newChat}
          className="mx-3 mb-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-palm/30 bg-palm-tint py-2 text-sm font-semibold text-palm transition hover:bg-palm hover:text-white active:scale-[0.98]"
        >
          <IconPlus size={15} />
          {t(locale, 'newChat')}
        </button>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openSession(s.id)}
              className={`block w-full cursor-pointer rounded-xl px-3 py-2 text-start text-xs transition hover:bg-sand-100 ${
                s.id === sessionId ? 'bg-sand-100 text-ink' : 'text-ink-soft'
              }`}
            >
              <span className="mb-0.5 block text-[10px] text-ink-faint">{fmtDate(s.startedAt)}</span>
              <span className="line-clamp-2 leading-4">{s.summary || t(locale, 'newChat')}</span>
            </button>
          ))}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-ink/30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* chat column */}
      <main className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-sand-200 bg-sand-50/80 px-4 py-2.5 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-lg p-1.5 text-ink-soft hover:bg-sand-100 md:hidden"
            aria-label={t(locale, 'sessions')}
          >
            <IconMenu size={18} />
          </button>
          <Link
            to="/"
            className="cursor-pointer rounded-lg p-1.5 text-ink-soft transition hover:bg-sand-100 hover:text-palm"
            title={t(locale, 'home')}
            aria-label={t(locale, 'home')}
          >
            <IconHome size={18} />
          </Link>
          <span className="font-display text-lg font-extrabold text-palm">
            {t(locale, 'appName')}
            <span className="text-clay">.</span>
          </span>
          <span className="flex-1" />
          <Link
            to="/settings"
            className="cursor-pointer rounded-lg p-1.5 text-ink-soft transition hover:bg-sand-100 hover:text-ink"
            title={t(locale, 'settings')}
            aria-label={t(locale, 'settings')}
          >
            <IconSettings size={17} />
          </Link>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {crisisResources && <CrisisCard resources={crisisResources} locale={locale} />}
            {messages.length === 0 && !sending && (
              <div className="mt-14 flex flex-col items-center text-center">
                <div className="relative mb-5 h-20 w-20">
                  <span className="absolute inset-0 animate-breathe rounded-full bg-palm-tint" />
                  <span className="absolute inset-4 animate-breathe rounded-full bg-palm/20 [animation-delay:1.2s]" />
                </div>
                <p className="text-sm text-ink-soft">{t(locale, 'emptyHint')}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {t(locale, 'starters').map((s) => (
                    <button
                      key={s}
                      onClick={() => send({ text: s })}
                      className="cursor-pointer rounded-full border border-sand-300 bg-white px-4 py-2 text-xs text-ink-soft shadow-card transition hover:border-palm/40 hover:text-palm active:scale-[0.97]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} locale={locale} ttsEnabled={Boolean(user?.ttsEnabled)} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-sand-200 bg-sand-50/80 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-sand-200 bg-white p-1.5 shadow-card">
            <MicButton locale={locale} disabled={sending} onAudio={(blob) => send({ audio: blob })} />
            <textarea
              ref={inputRef}
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
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 cursor-pointer rounded-full bg-palm p-3 text-white transition hover:bg-palm-deep active:scale-95 disabled:opacity-40"
              aria-label={t(locale, 'send')}
            >
              <IconSend size={17} className="rtl:-scale-x-100" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
