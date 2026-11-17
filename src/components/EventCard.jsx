import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import AcademicCrest from './AcademicCrest.jsx';

const tones = ['#DDEBDD', '#F2D9C4', '#E5DDF3', '#F4E3AF', '#D8E9F0', '#F1D8DC'];

export default function EventCard({
  event,
  index,
  href,
  onNavigate,
  actionLabel = 'Register',
  className = '',
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const tone = tones[index % tones.length];
  const number = String(index + 1).padStart(2, '0');
  const badgeCode = `${event.code || 'C'}${number}`;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[10px] border border-navy-950/20 bg-sand-100 text-navy-950 shadow-[0_16px_30px_-24px_rgba(2,8,20,0.95)] transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1 ${className}`}
    >
      <div className="relative px-5 pb-6 pt-4" style={{ backgroundColor: tone }}>
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-navy-950/20 bg-sand-50 text-navy-900">
            <AcademicCrest className="h-4 w-5" />
          </span>
          <span className="rounded-full border border-navy-950/20 bg-sand-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-navy-900">
            CITE'26
          </span>
        </div>

        <div className="relative mx-auto mt-3 w-fit">
          <div className="h-28 w-28 rounded-full border-[6px] border-sand-50 outline outline-2 outline-navy-950/20 sm:h-32 sm:w-32">
            <div className="h-full w-full overflow-hidden rounded-full border border-navy-950/10 bg-sand-200">
              {imageFailed ? (
                <span className="grid h-full w-full place-items-center font-display text-3xl font-black text-navy-900/40">
                  {event.name.charAt(0)}
                </span>
              ) : (
                <img
                  src={event.image}
                  alt={`${event.name} competition theme`}
                  width="600"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-navy-950/30 bg-navy-950 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] text-sand-100">
            {badgeCode}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold leading-[1.15] tracking-tight text-navy-950">
            {event.name}
          </h3>
          <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold tracking-[0.16em] text-navy-800/60">
            {number}
          </span>
        </div>
        <p className="mt-2 text-xs leading-snug text-navy-800/70">{event.category}</p>

        <div className="mt-auto border-t border-navy-950/15 pt-4">
          {onNavigate ? (
            <button
              type="button"
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-navy-900 transition-colors hover:text-navy-600"
            >
              {actionLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-navy-900 transition-colors hover:text-navy-600"
            >
              {actionLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
