import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Code2, Gamepad2 } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import Button from '../components/Button.jsx';
import EventCard from '../components/EventCard.jsx';
import { competitionCategories, events } from '../data/tracks.js';
import { event } from '../data/event.js';

const categoryIcons = { A: Code2, B: Gamepad2 };

export default function TracksPage() {
  const reduced = useReducedMotion();

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="تعمیر و تخلیق کی راہیں"
          title="Competitions"
          subtitle={`${events.length} Events • Two Arenas`}
          description="Explore the full CITE 2026 lineup — coding, design, gaming, and everything in between. Pick your event and register below."
        />

        {competitionCategories.map(({ code, title, events: categoryEvents }) => {
          const Icon = categoryIcons[code] || Code2;

          return (
            <section key={code} className="mt-12">
              <div className="flex flex-wrap items-center gap-4 border-b border-navy-700 pb-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-sand-400/50 bg-sand-300 text-navy-950">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-sand-400">
                    Category {code}
                  </p>
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ivory sm:text-2xl">
                    {title}
                  </h2>
                </div>
                <span className="ml-auto rounded border border-navy-700 bg-navy-900/70 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-sand-300">
                  {categoryEvents.length} Events
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryEvents.map((item, idx) => {
                  const eventIndex = events.findIndex(({ name }) => name === item.name);

                  return (
                    <motion.div
                      key={item.name}
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : idx * 0.025 }}
                      className="h-full"
                    >
                      <EventCard event={item} index={eventIndex} href={event.registrationUrl} />
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="academic-panel mt-12 flex flex-col gap-4 rounded-[8px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">
              Not sure where to start?
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-ivory sm:text-2xl">
              Register once, compete in any event
            </h3>
          </div>
          <Button href={event.registrationUrl} target="_blank" rel="noopener noreferrer" size="md">
            Register for CITE 2026
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
