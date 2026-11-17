import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import { eventSchedule } from '../data/schedule.js';

const typeBadgeStyles = {
  Ceremony: 'bg-navy-500/20 text-navy-300 border-navy-500/40',
  Competition: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Workshop: 'bg-sand-400/15 text-sand-300 border-sand-400/30',
  Judging: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  Break: 'bg-navy-750 text-ivory-muted border-navy-700',
};

const filterCategories = ['All', 'Competition', 'Workshop', 'Ceremony', 'Judging', 'Break'];

export default function SchedulePage() {
  const [filterType, setFilterType] = useState('All');
  const reduced = useReducedMotion();

  const filteredSessions = eventSchedule.sessions.filter((session) => {
    if (filterType === 'All') return true;
    return session.type === filterType;
  });

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="ایک دن — لمحہ بہ لمحہ جدوجہد"
          title="Event Timeline"
          subtitle="One Day • One Campus • Full Agenda"
          description="From the opening keynote to the closing ceremony, every session is scheduled to keep you building, learning, and competing on the day itself."
        />

        <div className="academic-panel mt-10 mb-8 grid gap-4 rounded-[8px] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-sand-400/30 bg-navy-900 text-sand-300">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-ivory">
                {eventSchedule.day}, {eventSchedule.date}
              </p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-ivory-muted">
                {eventSchedule.venue}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-sm font-bold text-sand-300">{eventSchedule.timeWindow}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ivory-subtle">
              Single-day agenda
            </p>
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          <SegmentedControl
            items={filterCategories}
            value={filterType}
            onChange={setFilterType}
            layoutId="schedule-filter"
            label="Filter sessions by type"
          />
        </div>

        <ol className="mx-auto max-w-4xl">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredSessions.length === 0 ? (
              <motion.li
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-navy-700 bg-navy-850 p-8 text-center text-ivory-muted"
              >
                <p className="text-sm font-medium">No sessions found for this filter.</p>
                <button
                  type="button"
                  onClick={() => setFilterType('All')}
                  className="mt-2 text-xs font-bold uppercase text-sand-300 hover:underline"
                >
                  Reset Filter
                </button>
              </motion.li>
            ) : (
              filteredSessions.map((session, index) => (
                <motion.li
                  key={`${session.time}-${session.title}`}
                  layout
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: reduced ? 0.12 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="relative pb-4 pl-7 last:pb-0 sm:pl-[132px]"
                >
                  {index > 0 && (
                    <span className="absolute left-[11px] top-0 h-6 w-px bg-navy-700 sm:left-[109px]" />
                  )}
                  {index < filteredSessions.length - 1 && (
                    <span className="absolute bottom-0 left-[11px] top-6 w-px bg-navy-700 sm:left-[109px]" />
                  )}
                  <span className="absolute left-[5px] top-[18px] h-3 w-3 rounded-full border-2 border-sand-300 bg-navy-950 ring-4 ring-navy-900 sm:left-[103px]" />

                  <div className="absolute left-0 top-4 hidden w-[92px] text-right sm:block">
                    <p className="font-mono text-sm font-bold text-sand-300">{session.time}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ivory-subtle">PKT</p>
                  </div>

                  <article className="group rounded-lg border border-navy-700/80 bg-navy-850 p-4 transition-colors hover:border-sand-400/60 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded border border-navy-700 bg-navy-900 px-2.5 py-1 font-mono text-xs font-bold text-sand-300 sm:hidden">
                        <Clock className="h-3.5 w-3.5" />
                        {session.time}
                      </span>
                       <span className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${typeBadgeStyles[session.type] ?? 'border-navy-700 bg-navy-750 text-ivory-muted'}`}>
                        {session.type}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ivory-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-sand-400" />
                        {session.location}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-ivory sm:text-lg">
                      {session.title}
                    </h3>
                  </article>
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ol>

        <p className="mt-10 text-center font-mono text-xs text-ivory-muted">
          All timings in Pakistan Standard Time (PKT). Tea, snacks, and prayer areas are available throughout the day.
        </p>
      </div>
    </div>
  );
}
