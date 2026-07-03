import PersonaChip from './PersonaChip.jsx';
import SpeakerButton from './SpeakerButton.jsx';

/** One chat message. Assistant bubbles carry the persona chip and (opt-in) speaker. */
export default function MessageBubble({ message, locale, ttsEnabled }) {
  const isUser = message.role === 'user';
  const isCrisis = message.persona === 'CRISIS';

  if (message.role === 'system') {
    return (
      <div className="mx-auto my-3 max-w-md rounded-xl bg-night-800/60 px-4 py-2 text-center text-[11px] leading-5 text-slate-500">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
          isUser
            ? 'bg-night-600 text-slate-100'
            : isCrisis
              ? 'border border-crisis/40 bg-night-800 text-slate-200'
              : 'bg-night-800 text-slate-200'
        }`}
      >
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2">
            <PersonaChip persona={message.persona} locale={locale} />
            {ttsEnabled && !isCrisis && message.id && !message.streaming && (
              <SpeakerButton messageId={message.id} content={message.content} locale={locale} />
            )}
          </div>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-7">
          {message.content}
          {message.streaming && <span className="ms-1 inline-block h-4 w-2 animate-pulseDot rounded-sm bg-slate-400 align-middle" />}
        </div>
      </div>
    </div>
  );
}
