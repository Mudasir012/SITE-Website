import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Mail, Search } from 'lucide-react';
import { Reveal, RevealHeading } from '../components/ScrollReveal.jsx';
import { faqs } from '../data/faqs.js';
import { event } from '../data/event.js';

const pad = (value) => String(value).padStart(2, '0');

const faqGroups = [
  { id: 'all', label: 'All questions', indices: null },
  { id: 'eligibility', label: 'Eligibility & teams', indices: [0, 1] },
  { id: 'rules', label: 'Preparation & rules', indices: [2, 3, 4] },
];

const labelForIndex = (index) =>
  index <= 1 ? 'Eligibility & teams' : 'Preparation & rules';

function FaqRow({ item, index, reduced, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonId = `faq-desk-btn-${index}`;
  const panelId = `faq-desk-panel-${index}`;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-white/10"
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="group flex w-full gap-4 py-6 text-left sm:gap-6 sm:py-7"
        >
          <span className="mt-1 font-display text-[10px] font-bold tabular-nums tracking-[0.16em] text-arcade-lime">
            {pad(index + 1)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-display text-[9px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
              {labelForIndex(index)}
            </span>
            <span
              className={`mt-2 block font-display text-base font-bold uppercase leading-[1.2] tracking-[-0.02em] transition-colors duration-200 sm:text-xl ${
                open ? 'text-arcade-bone' : 'text-arcade-bone/75 group-hover:text-arcade-bone'
              }`}
            >
              {item.q}
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`relative mt-1 grid h-9 w-9 shrink-0 place-items-center border transition-colors duration-200 ${
              open
                ? 'border-arcade-lime bg-arcade-lime text-arcade-ink'
                : 'border-white/20 text-arcade-bone group-hover:border-arcade-lime group-focus-visible:border-arcade-lime'
            }`}
          >
            <span className="absolute h-[1.5px] w-3.5 bg-current" />
            <span
              className={`absolute h-3.5 w-[1.5px] bg-current transition-transform duration-300 ${
                open ? 'rotate-90 scale-0' : 'rotate-0'
              }`}
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex gap-4 pb-7 sm:ml-10">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 bg-arcade-violet" />
              <p className="font-display text-sm leading-relaxed text-arcade-mute sm:text-base">
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqPage() {
  const [activeGroup, setActiveGroup] = useState('all');
  const [query, setQuery] = useState('');
  const reduced = useReducedMotion();

  const visibleFaqs = useMemo(() => {
    const group = faqGroups.find(({ id }) => id === activeGroup);
    const term = query.trim().toLowerCase();

    return faqs
      .map((item, index) => ({ ...item, index }))
      .filter(({ index }) => (group?.indices ? group.indices.includes(index) : true))
      .filter(({ q, a }) => {
        if (!term) return true;
        return `${q} ${a}`.toLowerCase().includes(term);
      });
  }, [activeGroup, query]);

  const resetDesk = () => {
    setActiveGroup('all');
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-arcade-ink pb-24 pt-14 font-display text-arcade-bone sm:pt-16 md:pt-20">
      {/* Hero — information desk, no media */}
      <section className="relative overflow-hidden border-b border-white/10 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] border-l border-white/10 lg:block"
        >
          <div className="flex h-full flex-col justify-between p-8 xl:p-10">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              Info desk / {pad(faqs.length)} files
            </span>
            <span className="font-display text-[9rem] font-bold leading-none tracking-[-0.08em] text-white/[0.05] xl:text-[11rem]">
              ?
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
              Search. Open. Resolve.
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
            Before you register
          </motion.p>

          <RevealHeading
            as="h1"
            lines={[{ text: 'Questions,' }, { text: 'answered.', accent: true }]}
            className="font-display font-bold uppercase leading-[0.82] tracking-[-0.06em] text-arcade-bone"
            style={{ fontSize: 'clamp(3.6rem, 9.5vw, 7.5rem)' }}
          />

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:pr-[38%]">
            <Reveal className="max-w-2xl" delay={0.12}>
              <p className="font-display text-base leading-relaxed text-arcade-mute sm:text-lg">
                Clear details on eligibility, teams, what to bring, competition rules, and how
                projects are judged.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-arcade-lime">
                {pad(faqs.length)} answers · Updated for 2026
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Question console */}
      <section className="bg-arcade-coal py-16 sm:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                Browse desk
              </p>

              <div className="mt-4 grid gap-px border border-white/10 bg-white/10">
                {faqGroups.map(({ id, label, indices }) => {
                  const count = indices ? indices.length : faqs.length;
                  const isActive = activeGroup === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveGroup(id)}
                      className={`flex items-center justify-between gap-4 px-4 py-4 text-left font-display text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
                        isActive
                          ? 'bg-arcade-lime text-arcade-ink'
                          : 'bg-arcade-ink text-arcade-mute hover:text-arcade-bone'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={isActive ? 'opacity-60' : 'text-white/30'}>{pad(count)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 border border-white/10 bg-arcade-ink p-5">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
                  Need a human?
                </p>
                <p className="mt-3 font-display text-xs leading-relaxed text-arcade-mute">
                  The CITE student committee can help with registration, teams, and competition rules.
                </p>
                <div className="mt-5 grid gap-2">
                  <a
                    href={`mailto:${event.contact.email}`}
                    className="inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-arcade-bone transition-colors hover:text-arcade-lime"
                  >
                    <Mail className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
                    {event.contact.email}
                  </a>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-arcade-mute"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the desk"
                  aria-label="Search frequently asked questions"
                  className="w-full border border-white/15 bg-arcade-ink py-3 pl-10 pr-4 font-display text-xs text-arcade-bone placeholder:text-arcade-mute/70 focus:border-arcade-lime focus:outline-none"
                />
              </div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
                {pad(visibleFaqs.length)} / {pad(faqs.length)} files shown
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
              {faqGroups.map(({ id, label }) => {
                const isActive = activeGroup === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveGroup(id)}
                    className={`border px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                      isActive
                        ? 'border-arcade-lime bg-arcade-lime text-arcade-ink'
                        : 'border-white/15 text-arcade-mute hover:border-white/40 hover:text-arcade-bone'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 border-t border-white/10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${activeGroup}-${query}`}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduced
                      ? { opacity: 0, transition: { duration: 0.12 } }
                      : { opacity: 0, y: -10, transition: { duration: 0.16 } }
                  }
                  transition={{ duration: reduced ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {visibleFaqs.length === 0 ? (
                    <div className="border-b border-white/10 py-16 text-center">
                      <p className="font-display text-lg font-bold uppercase tracking-[-0.02em] text-arcade-bone">
                        No matching files
                      </p>
                      <p className="mt-2 font-display text-sm text-arcade-mute">
                        Try a different term or open the full desk.
                      </p>
                      <button
                        type="button"
                        onClick={resetDesk}
                        className="mt-5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-lime hover:underline"
                      >
                        Reset desk
                      </button>
                    </div>
                  ) : (
                    visibleFaqs.map(({ index, q, a }, position) => (
                      <FaqRow
                        key={`${index}-${q}`}
                        item={{ q, a }}
                        index={index}
                        reduced={reduced}
                        defaultOpen={position === 0}
                      />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Closing action */}
      <section className="border-t border-white/10 bg-arcade-ink py-16 sm:py-20">
        <div className="wrap flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              Still have questions?
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-[-0.045em] text-arcade-bone sm:text-5xl">
              Ready when you are
            </h2>
            <a
              href={`mailto:${event.contact.email}`}
              className="mt-4 inline-flex items-center gap-2 font-display text-sm font-bold text-arcade-lime hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {event.contact.email}
            </a>
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
