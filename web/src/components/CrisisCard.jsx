/**
 * Crisis resources card (spec Sections 4 + 11) — pinned to the top of the chat
 * in crisis state. Calm styling, tel: links, no alarmist red.
 */
export default function CrisisCard({ resources, locale }) {
  if (!resources) return null;
  const ar = locale !== 'en';
  return (
    <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-crisis/40 bg-night-800/95 p-4 shadow-lg backdrop-blur">
      <h3 className="mb-1 text-sm font-bold text-crisis">{ar ? resources.title_ar : resources.title_en}</h3>
      <p className="mb-3 text-sm leading-6 text-slate-300">{ar ? resources.advice_ar : resources.advice_en}</p>
      <ul className="mb-3 space-y-2">
        {(resources.resources || []).map((r) => (
          <li key={r.phone}>
            <a
              href={`tel:${r.phone}`}
              className="flex items-center justify-between rounded-xl border border-night-600 bg-night-900 px-3 py-2.5 transition hover:border-crisis/50"
            >
              <span className="text-sm text-slate-200">{ar ? r.name_ar : r.name_en}</span>
              <span dir="ltr" className="font-mono text-base font-bold text-crisis">
                {r.phone}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-5 text-slate-400">{ar ? resources.emergency_ar : resources.emergency_en}</p>
    </div>
  );
}
