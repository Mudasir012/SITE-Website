import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const accents = {
  A: {
    label: 'CS',
    text: 'text-arcade-violet',
    block: 'bg-arcade-violet',
    border: 'border-arcade-violet/50',
  },
  B: {
    label: 'EX',
    text: 'text-arcade-limeHot',
    block: 'bg-arcade-limeHot',
    border: 'border-arcade-limeHot/50',
  },
};

export default function EventCard({
  event,
  index,
  href,
  onNavigate,
  actionLabel = 'Register',
  className = '',
}) {
  const reduced = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const accent = accents[event.code] || accents.A;
  const number = String(index + 1).padStart(2, '0');
  const enterDelay = Math.min(index * 0.035, 0.32);
  const actionClass = `group/action inline-flex w-full items-center justify-between gap-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors duration-200 hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal ${accent.text}`;

  const action = (
    <>
      <span>{actionLabel}</span>
      <span className="grid h-8 w-8 shrink-0 place-items-center border border-white/15 text-arcade-bone transition-all duration-300 group-hover/action:border-arcade-lime group-hover/action:bg-arcade-lime group-hover/action:text-arcade-ink group-focus-within/action:border-arcade-lime group-focus-within/action:bg-arcade-lime group-focus-within/action:text-arcade-ink">
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" aria-hidden="true" />
      </span>
    </>
  );

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 26, rotateX: -7 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.62, delay: enterDelay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 900, transformStyle: 'preserve-3d' }}
      className={`group relative flex h-full min-h-[340px] overflow-hidden border border-white/10 bg-arcade-coal shadow-[0_28px_60px_-42px_rgba(0,0,0,0.95)] transition-colors duration-300 hover:border-white/25 focus-within:border-white/30 ${className}`}
    >
      <div className="relative z-10 flex w-[54px] shrink-0 flex-col items-center justify-between border-r border-white/10 bg-arcade-ink px-2 py-4">
        <span className={`font-display text-[10px] font-bold uppercase tracking-[0.18em] ${accent.text}`}>
          {event.code || 'C'}
        </span>
        <span className="font-display text-xl font-bold tabular-nums tracking-[-0.04em] text-arcade-bone [writing-mode:vertical-rl]">
          {number}
        </span>
        <span aria-hidden="true" className={`h-9 w-[3px] ${accent.block}`} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative h-[124px] shrink-0 overflow-hidden border-b border-white/10 bg-arcade-ink">
          <motion.div
            initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
            whileInView={reduced ? undefined : { clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, delay: enterDelay + 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {imageFailed ? (
              <div className="grid h-full w-full place-items-center bg-arcade-coal">
                <span className={`font-display text-4xl font-bold tracking-[-0.06em] ${accent.text}`}>
                  {event.name.charAt(0)}
                </span>
              </div>
            ) : (
              <img
                src={event.image}
                alt=""
                width="600"
                height="600"
                loading="lazy"
                decoding="async"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover opacity-70 transition-transform duration-500 ease-out group-hover:scale-[1.06] group-focus-within:scale-[1.06]"
              />
            )}
          </motion.div>
          <span aria-hidden="true" className="absolute inset-0 bg-arcade-ink/25" />
          <span aria-hidden="true" className="absolute right-3 top-3 grid h-7 w-7 place-items-center border border-white/15 bg-arcade-ink/80">
            <img
              src="/CITE_White_Icon_Only.png"
              alt=""
              width="20"
              height="20"
              loading="lazy"
              decoding="async"
              className="h-5 w-5 object-contain"
            />
          </span>
          <span aria-hidden="true" className={`absolute bottom-0 left-0 h-[3px] w-16 ${accent.block}`} />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <h3 className="font-display text-xl font-bold uppercase leading-[1.05] tracking-[-0.04em] text-arcade-bone sm:text-2xl">
              {event.name}
            </h3>
            <p className="mt-2 font-display text-xs leading-relaxed text-arcade-mute">{event.category}</p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
            <div className="bg-arcade-ink px-3 py-2.5">
              <dt className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-arcade-mute">
                Prize pool
              </dt>
              <dd className="mt-1 font-display text-[11px] font-bold leading-tight text-arcade-bone">
                {event.prize || 'To be announced'}
              </dd>
            </div>
            <div className="bg-arcade-ink px-3 py-2.5">
              <dt className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-arcade-mute">
                Format
              </dt>
              <dd className="mt-1 font-display text-[11px] font-bold leading-tight text-arcade-bone">
                {event.format || 'On-site judging'}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-arcade-mute">
            {event.eligibility || 'Degree students'}
          </p>

          <div className="mt-auto pt-5">
            <div className="border-t border-white/10 pt-4">
              {onNavigate ? (
                <button
                  type="button"
                  onClick={onNavigate}
                  aria-label={`${actionLabel} for ${event.name}`}
                  className={actionClass}
                >
                  {action}
                </button>
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${actionLabel} for ${event.name}`}
                  className={actionClass}
                >
                  {action}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.span
        aria-hidden="true"
        initial={reduced ? false : { scaleX: 0 }}
        whileInView={reduced ? undefined : { scaleX: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: enterDelay + 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0 }}
        className={`absolute bottom-0 left-[54px] right-0 h-[2px] ${accent.block}`}
      />
    </motion.article>
  );
}
