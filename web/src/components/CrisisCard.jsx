/**
 * Crisis resources card (spec Sections 4 + 11) — pinned to the top of the chat
 * in crisis state. Calm styling: soft slate-blue, no alarmist red, big tap targets.
 */
export default function CrisisCard({ resources, locale }) {
  if (!resources) return null;
  const ar = locale !== 'en';
  return (
    <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-crisis/30 bg-crisis-tint/95 p-4 shadow-warm backdrop-blur">
      <h3 className="mb-1 font-display text-sm font-bold text-crisis">{ar ? resources.title_ar : resources.title_en}</h3>
      <p className="mb-3 text-sm leading-6 text-ink">{ar ? resources.advice_ar : resources.advice_en}</p>
      <ul className="mb-3 space-y-2">
        {(resources.resources || []).map((r) => (
          <li key={r.phone}>
            <a
              href={`tel:${r.phone}`}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-sand-200 bg-white px-3 py-3 shadow-card transition hover:border-crisis/50 active:scale-[0.99]"
            >
              <span className="text-sm text-ink">{ar ? r.name_ar : r.name_en}</span>
              <span dir="ltr" className="font-mono text-base font-bold text-crisis">
                {r.phone}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-5 text-ink-soft">{ar ? resources.emergency_ar : resources.emergency_en}</p>
    </div>
  );
}
