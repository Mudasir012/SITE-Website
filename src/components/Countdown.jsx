import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function getRemaining(target) {
  const targetTime = new Date(target).getTime();
  if (!Number.isFinite(targetTime)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const diff = Math.max(0, targetTime - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
    done: diff === 0,
  };
}

function Digit({ value, className = '' }) {
  const reduced = useReducedMotion();

  return (
    // Explicit width: the digit spans are absolutely positioned, so without
    // this the wrapper collapses to ~0px and clips the number.
    <span className="relative block h-[1em] w-[2.2ch] overflow-hidden tabular-nums">
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          initial={reduced ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 flex items-center justify-center ${className}`}
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Countdown({ target, doneLabel = 'Competitions are Live!', variant = 'default' }) {
  const [t, setT] = useState(() => getRemaining(target));
  const isPaper = variant === 'paper';

  useEffect(() => {
    setT(getRemaining(target));
    const id = setInterval(() => setT(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.done) {
    if (isPaper) {
      return (
        <div role="status" className="font-handwriting text-2xl text-[#3B2F14]">
          {doneLabel}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-950/40 px-5 py-3 text-emerald-300 font-semibold" role="status">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {doneLabel}
      </div>
    );
  }

  const units = [
    { label: 'Days', value: t.days },
    { label: 'Hours', value: t.hours },
    { label: 'Minutes', value: t.minutes },
    { label: 'Seconds', value: t.seconds },
  ];

  return (
    <div
      role="timer"
      aria-label="Countdown to event start"
      className={isPaper ? 'grid grid-cols-4 gap-1 sm:gap-3' : 'grid grid-cols-4 gap-2 sm:gap-3'}
    >
      {units.map(({ label, value }) => (
        <div
          key={label}
          className={
            isPaper
              ? 'flex flex-col items-center border-b border-[#B89052]/70 pb-1'
              : 'flex flex-col items-center justify-center rounded-lg border border-navy-700 bg-navy-850 px-2.5 py-3 sm:py-4 shadow-sm'
          }
        >
          <span
            className={
              isPaper
                ? 'font-handwriting text-4xl leading-none text-[#3B2F14] sm:text-5xl'
                : 'font-mono text-2xl font-bold text-ivory sm:text-3xl md:text-4xl'
            }
          >
            <Digit value={value} />
          </span>
          <span
            className={
              isPaper
                ? 'mt-1 font-handwriting text-sm leading-none text-[#5B4214]'
                 : 'mt-1 font-mono text-[11px] uppercase tracking-widest text-sand-400 font-semibold sm:text-xs'
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
