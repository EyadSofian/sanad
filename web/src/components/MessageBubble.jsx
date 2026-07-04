import { motion } from 'framer-motion';
import PersonaChip from './PersonaChip.jsx';
import SpeakerButton from './SpeakerButton.jsx';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-ink-faint"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/** One chat message. Assistant bubbles carry the persona chip and (opt-in) speaker. */
export default function MessageBubble({ message, locale, ttsEnabled }) {
  const isUser = message.role === 'user';
  const isCrisis = message.persona === 'CRISIS';

  if (message.role === 'system') {
    return (
      <div className="mx-auto my-3 max-w-md rounded-full bg-sand-100 px-4 py-2 text-center text-[11px] leading-5 text-ink-faint">
        {message.content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
          isUser
            ? 'rounded-ee-md bg-palm text-white shadow-card'
            : isCrisis
              ? 'rounded-es-md border border-crisis/30 bg-crisis-tint text-ink shadow-card'
              : 'rounded-es-md border border-sand-200 bg-white text-ink shadow-card'
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
          {message.streaming && !message.content ? (
            <TypingDots />
          ) : (
            <>
              {message.content}
              {message.streaming && (
                <span className="ms-1 inline-block h-4 w-2 animate-pulseDot rounded-sm bg-ink-faint align-middle" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
