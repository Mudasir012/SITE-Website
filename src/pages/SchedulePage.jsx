import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import { event } from '../data/event.js';
import { eventSchedule } from '../data/schedule.js';

const typeAccents = {
  Ceremony: {
    text: 'text-arcade-violet',
    dot: 'bg-arcade-violet',
    chip: 'border-arcade-violet/50 text-arcade-violet',
  },
  Competition: {
    text: 'text-arcade-limeHot',
    dot: 'bg-arcade-limeHot',
    chip: 'border-arcade-limeHot/50 text-arcade-limeHot',
  },
  Workshop: {
    text: 'text-arcade-bone',
    dot: 'bg-arcade-bone',
    chip: 'border-white/30 text-arcade-bone',
  },
  Judging: {
    text: 'text-arcade-violet',
    dot: 'bg-arcade-violet',
    chip: 'border-arcade-violet/50 text-arcade-violet',
  },
  Break: {
    text: 'text-arcade-mute',
    dot: 'bg-arcade-mute',
    chip: 'border-white/20 text-arcade-mute',
  },
};

const filterTypes = ['All', 'Competition', 'Workshop', 'Ceremony', 'Judging', 'Break'];

function FilterRail({ items, value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Filter sessions by type"
      className="inline-flex flex-wrap items-center gap-1 border border-white/10 bg-arcade-ink p-1"
    >
      {items.map(({ id, label, count }) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            className={`relative px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink sm:px-4 ${
              isActive ? 'text-arcade-ink' : 'text-arcade-mute hover:text-arcade-bone'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="schedule-filter-active"
                aria-hidden="true"
                className="absolute inset-0 bg-arcade-lime"
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {label}
              <span className={isActive ? 'opacity-60' : 'text-white/30'}>{String(count).padStart(2, '0')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TimelineSession({ session, index, total, active, onActivate, reduced, scrollYProgress }) {
  const ref = useRef(null);
  const inCenter = useInView(ref, { amount: 0.6 });

  useEffect(() => {
    if (inCenter) onActivate(index);
  }, [inCenter, index, onActivate]);

  const span = 1 / total;
  const center = (index + 0.5) / total;
  const from = Math.max(0, center - span);
  const to = Math.min(1, center + span);

  const y = useTransform(scrollYProgress, [from, center, to], [78, 0, -46]);
  const rotateX = useTransform(scrollYProgress, [from, center, to], [18, 0, -10]);
  const z = useTransform(scrollYProgress, [from, center, to], [-240, 0, -140]);
  const opacity = useTransform(scrollYProgress, [from, center, to], [0.3, 1, 0.75]);

  const accent = typeAccents[session.type] || typeAccents.Break;

  return (
    <motion.li
      ref={ref}
      data-session-index={index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
      transition={{ duration: reduced ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative pb-5 pl-9 last:pb-0 sm:pl-14"
    >
      <span aria-hidden="true" className="absolute left-[13px] top-0 h-full w-px bg-white/10 sm:left-[21px]" />
      <span
        aria-hidden="true"
        className={`absolute left-[7px] top-8 h-3 w-3 border border-white/20 transition-colors duration-300 sm:left-[15px] ${
          active ? accent.dot : 'bg-arcade-ink'
        }`}
      />

      <motion.article
        style={
          reduced
            ? undefined
            : { y, rotateX, z, transformPerspective: 900, transformStyle: 'preserve-3d' }
        }
        className={`group relative border bg-arcade-ink p-5 transition-colors duration-300 sm:p-6 ${
          active ? 'border-white/30' : 'border-white/10 hover:border-white/25'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-display text-lg font-bold tabular-nums tracking-[-0.04em] ${accent.text}`}>
            {session.time}
          </span>
          <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
            PKT
          </span>
          <span
            className={`ml-auto inline-flex items-center border px-2 py-1 font-display text-[9px] font-bold uppercase tracking-[0.16em] ${accent.chip}`}
          >
            {session.type}
          </span>
        </div>

        <h3 className="mt-3 font-display text-xl font-bold uppercase leading-[1.1] tracking-[-0.03em] text-arcade-bone sm:text-2xl">
          {session.title}
        </h3>

        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-arcade-mute" aria-hidden="true" />
          <span className="font-display text-[11px] uppercase tracking-[0.12em] text-arcade-mute">
            {session.location}
          </span>
          <span className="ml-auto font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
            Step {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-[2px] w-12 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${accent.dot}`}
        />
      </motion.article>
    </motion.li>
  );
}

export default function SchedulePage() {
  const [filterType, setFilterType] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion();
  const timelineRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });

  const filteredSessions = useMemo(
    () =>
      eventSchedule.sessions.filter((session) => {
        if (filterType === 'All') return true;
        return session.type === filterType;
      }),
    [filterType]
  );

  const filterItems = useMemo(
    () =>
      filterTypes.map((id) => ({
        id,
        label: id,
        count:
          id === 'All'
            ? eventSchedule.sessions.length
            : eventSchedule.sessions.filter((session) => session.type === id).length,
      })),
    []
  );

  const handleActivate = useCallback((index) => setActiveIndex(index), []);

  useEffect(() => {
    setActiveIndex(0);
  }, [filterType]);

  const activeSession = filteredSessions[activeIndex] || filteredSessions[0] || eventSchedule.sessions[0];

  return (
    <div className="min-h-screen bg-arcade-ink pb-24 pt-14 font-display text-arcade-bone sm:pt-16 md:pt-20">
      {/* Hero — typographic run-of-show board, no media */}
      <section className="relative overflow-hidden border-b border-white/10 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] border-l border-white/10 lg:block"
        >
          <div className="flex h-full flex-col justify-between p-8 xl:p-10">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              Run of show / 01
            </span>
            <span className="font-display text-[8rem] font-bold leading-none tracking-[-0.08em] text-white/[0.05] xl:text-[10rem]">
              12
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
              Scroll to descend
            </span>
          </div>
        </div>

        <div className="wrap relative">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-arcade-lime"
          >
            Saturday · December 12, 2026
          </motion.p>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 32 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl font-display font-bold uppercase leading-[0.82] tracking-[-0.06em] text-arcade-bone"
            style={{ fontSize: 'clamp(3.5rem, 9.5vw, 7.5rem)' }}
          >
            Run of show
          </motion.h1>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3"
          >
            {[
              { label: 'Doors open', value: '9:00 AM', note: 'Check-in begins' },
              { label: 'Sessions', value: String(eventSchedule.sessions.length).padStart(2, '0'), note: 'One campus day' },
              { label: 'Last call', value: '6:00 PM', note: 'Program concludes' },
            ].map((stat) => (
              <div key={stat.label} className="bg-arcade-ink p-5">
                <p className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums tracking-[-0.05em] text-arcade-bone">
                  {stat.value}
                </p>
                <p className="mt-1 font-display text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {stat.note}
                </p>
              </div>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-display text-[11px] uppercase tracking-[0.12em] text-arcade-mute">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
              {eventSchedule.day}, {eventSchedule.date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
              {eventSchedule.timeWindow}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
              {eventSchedule.venue}
            </span>
          </div>

          <p className="mt-8 inline-flex items-center gap-3 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-bone">
            <ArrowDown className="h-4 w-4 text-arcade-lime" aria-hidden="true" />
            Scroll through the day
          </p>
        </div>
      </section>

      {/* Filter band */}
      <section className="border-b border-white/10 bg-arcade-coal py-7">
        <div className="wrap flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
            Filter the timeline
          </p>
          <FilterRail items={filterItems} value={filterType} onChange={setFilterType} />
        </div>
      </section>

      {/* Mobile live-position HUD */}
      <div className="sticky top-14 z-30 border-b border-white/10 bg-arcade-ink px-4 py-3 sm:top-16 lg:hidden">
        <div className="wrap">
          <div className="flex items-center gap-3">
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              Now
            </span>
            <span className="font-display text-base font-bold tabular-nums tracking-[-0.04em] text-arcade-lime">
              {activeSession.time}
            </span>
            <span className="truncate font-display text-[10px] uppercase tracking-[0.1em] text-arcade-mute">
              {activeSession.title}
            </span>
          </div>
          <div className="mt-2 h-[2px] bg-white/10">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full w-full origin-left bg-arcade-lime"
            />
          </div>
        </div>
      </div>

      {/* Scroll-driven time shaft */}
      <section ref={timelineRef} className="relative bg-arcade-coal py-16 sm:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                Day 01 / Live position
              </p>
              <p className="mt-3 font-display text-5xl font-bold tabular-nums tracking-[-0.06em] text-arcade-lime">
                {activeSession.time}
              </p>
              <p className="mt-2 max-w-[200px] font-display text-xs leading-relaxed text-arcade-mute">
                {activeSession.title}
              </p>
              <div className="mt-8 h-[2px] w-full bg-white/10">
                <motion.div
                  style={{ scaleX: scrollYProgress }}
                  className="h-full w-full origin-left bg-arcade-lime"
                />
              </div>
              <div className="mt-3 flex justify-between font-display text-[9px] font-bold uppercase tracking-[0.16em] text-arcade-mute">
                <span>9:00 AM</span>
                <span>6:00 PM</span>
              </div>
              <p className="mt-10 font-display text-[10px] uppercase tracking-[0.2em] text-white/35">
                Scroll to move through the day
              </p>
            </div>
          </aside>

          <ol
            className="relative"
            style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
          >
            <AnimatePresence initial={false}>
              {filteredSessions.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-white/10 bg-arcade-ink p-8 text-center"
                >
                  <p className="font-display text-sm text-arcade-mute">No sessions found for this filter.</p>
                  <button
                    type="button"
                    onClick={() => setFilterType('All')}
                    className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-lime hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime"
                  >
                    Reset filter
                  </button>
                </motion.li>
              ) : (
                filteredSessions.map((session, index) => (
                  <TimelineSession
                    key={`${session.time}-${session.title}`}
                    session={session}
                    index={index}
                    total={filteredSessions.length}
                    active={activeIndex === index}
                    onActivate={handleActivate}
                    reduced={reduced}
                    scrollYProgress={scrollYProgress}
                  />
                ))
              )}
            </AnimatePresence>
          </ol>
        </div>
      </section>

      {/* Closing action */}
      <section className="border-t border-white/10 bg-arcade-ink py-16 sm:py-20">
        <div className="wrap flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              All timings in Pakistan Standard Time
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-[-0.045em] text-arcade-bone sm:text-5xl">
              See you on 12 December
            </h2>
          </div>
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-3 bg-arcade-lime px-6 py-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink"
          >
            Register as an Ambassador
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </section>
    </div>
  );
}
