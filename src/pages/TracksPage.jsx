import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Code2, Gamepad2 } from 'lucide-react';
import EventCard from '../components/EventCard.jsx';
import { Reveal } from '../components/ScrollReveal.jsx';
import { competitionCategories, events } from '../data/tracks.js';
import { event } from '../data/event.js';

const categoryIcons = { A: Code2, B: Gamepad2 };

const laneAccents = {
  A: {
    text: 'text-arcade-violet',
    block: 'bg-arcade-violet',
    border: 'border-arcade-violet/50',
    chip: 'bg-arcade-violet text-white',
  },
  B: {
    text: 'text-arcade-limeHot',
    block: 'bg-arcade-limeHot',
    border: 'border-arcade-limeHot/50',
    chip: 'bg-arcade-limeHot text-white',
  },
};

const laneShortNames = {
  A: 'Computer science',
  B: 'Fun & esports',
};

export default function TracksPage() {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-arcade-ink pb-24 pt-14 font-display text-arcade-bone sm:pt-16 md:pt-20">
      {/* Competition index — deliberately typographic, no hero media */}
      <section className="relative overflow-hidden border-b border-white/10 bg-arcade-ink py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[36%] border-l border-white/10 bg-arcade-coal lg:block"
        >
          <div className="flex h-full flex-col justify-center gap-8 p-8 xl:p-10">
            {competitionCategories.map(({ code, events: categoryEvents }) => (
              <div key={code} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className={`font-display text-4xl font-bold tabular-nums tracking-[-0.06em] ${laneAccents[code]?.text || 'text-arcade-bone'}`}>
                    {String(categoryEvents.length).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
                    {laneShortNames[code] || code}
                  </span>
                </div>
                <span aria-hidden="true" className={`mt-3 block h-[2px] w-full ${laneAccents[code]?.block || 'bg-arcade-bone'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="wrap relative">
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 32 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl font-display font-bold uppercase leading-[0.82] tracking-[-0.06em] text-arcade-bone"
            style={{ fontSize: 'clamp(3.8rem, 10vw, 8rem)' }}
          >
            Competitions
          </motion.h1>

          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:pr-[38%]">
            <Reveal className="max-w-2xl" delay={0.12}>
              <p className="font-display text-base leading-relaxed text-arcade-mute sm:text-lg">
                Explore the full CITE 2026 lineup — coding, design, gaming, and everything in between.
                Pick your event and register below.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-arcade-lime">
                {events.length} Events • Two Arenas
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {competitionCategories.map(({ code, title, events: categoryEvents }, categoryIndex) => {
        const Icon = categoryIcons[code] || Code2;
        const accent = laneAccents[code] || laneAccents.A;

        return (
          <section
            key={code}
            aria-labelledby={`category-${code}`}
            className={categoryIndex % 2 === 0 ? 'bg-arcade-coal py-20 sm:py-24' : 'bg-arcade-ink py-20 sm:py-24'}
          >
            <div className="wrap">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center border font-display text-sm font-bold ${accent.border} ${accent.chip}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2
                    id={`category-${code}`}
                    className="font-display text-2xl font-bold uppercase leading-[1.05] tracking-[-0.045em] text-arcade-bone sm:text-4xl"
                  >
                    {title}
                  </h2>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <motion.span
                    aria-hidden="true"
                    initial={reduced ? false : { scaleX: 0 }}
                    whileInView={reduced ? undefined : { scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className={`hidden h-[2px] w-24 sm:block ${accent.block}`}
                  />
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                    {categoryEvents.length} Events
                  </span>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoryEvents.map((item) => {
                  const eventIndex = events.findIndex(({ name }) => name === item.name);
                  return (
                    <EventCard
                      key={item.name}
                      event={events[eventIndex]}
                      index={eventIndex}
                      href={event.registrationUrl}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      {/* Closing register action — a quiet band after the dense index */}
      <section className="bg-arcade-coal py-20 sm:py-24">
        <div className="wrap">
          <Reveal className="border border-white/10 bg-arcade-ink p-8 sm:p-12">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase leading-[1.05] tracking-[-0.045em] text-arcade-bone sm:text-4xl">
                  Register once, compete in any event
                </h2>
                <p className="mt-3 font-display text-sm text-arcade-mute">Not sure where to start?</p>
              </div>
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex shrink-0 items-center justify-center gap-3 bg-arcade-lime px-6 py-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink"
              >
                Register for CITE 2026
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
