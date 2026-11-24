import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  Landmark,
  MapPin,
  Users,
} from 'lucide-react';
import { Reveal, RevealHeading } from '../components/ScrollReveal.jsx';
import { event } from '../data/event.js';

const checklistItems = [
  'Form a team of 2–4 builders (solo registrants get matched on the day)',
  'Pick an event from our 19-competition lineup',
  'Pack your laptop, chargers, and valid student ID card or CNIC',
];

const factIcons = { GraduationCap, Landmark, Award };

const ticketBase =
  'group inline-flex items-center justify-center gap-3 bg-arcade-lime px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink';

export default function AboutPage({ onNavigate }) {
  const [checkedItems, setCheckedItems] = useState([0, 1]);

  const toggleCheck = (idx) => {
    setCheckedItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const progress = Math.round((checkedItems.length / checklistItems.length) * 100);

  return (
    <div className="bg-arcade-ink font-display text-arcade-bone">
      {/* Editorial dossier hero — no hero media, distinct from Home */}
      <section className="relative overflow-hidden bg-arcade-ink py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[34%] border-l border-white/10 bg-arcade-coal lg:block"
        >
          <div className="flex h-full flex-col justify-between p-8 xl:p-10">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-arcade-violet">
              Dossier / 01
            </p>
            <ol className="space-y-6">
              {['Heritage', 'Campus', 'Readiness'].map((label, index) => (
                <li key={label} className="border-b border-white/10 pb-3 text-right">
                  <span className="font-display text-[11px] font-bold tabular-nums text-arcade-lime">
                    0{index + 1}
                  </span>
                  <span className="ml-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-arcade-bone/70">
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
              CUI / ABT — 2026
            </p>
          </div>
        </div>

        <div className="wrap relative">
          <div className="lg:max-w-[62%]">
            <Reveal>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-arcade-violet">
                About CITE 2026
              </p>
            </Reveal>

            <RevealHeading
              as="h1"
              lines={[{ text: 'About' }, { text: "CITE'26", tone: 'violet' }]}
              className="mt-6 font-display font-bold uppercase leading-[0.84] tracking-[-0.055em] text-arcade-bone"
              style={{ fontSize: 'clamp(4rem, 11vw, 8.5rem)' }}
            />

            <Reveal className="mt-9 max-w-2xl" delay={0.14}>
              <p className="font-display text-lg font-bold uppercase tracking-[0.06em] text-arcade-bone sm:text-xl">
                Where Ambition Meets Opportunity at CUI Abbottabad
              </p>
              <p className="mt-3 font-display text-sm leading-relaxed text-arcade-mute sm:text-base">
                CITE 2026 is COMSATS University Abbottabad’s flagship national student competition
                &amp; tech convention — organized by students, for students.
              </p>
            </Reveal>

            <Reveal className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center" delay={0.22}>
              <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className={ticketBase}>
                <span>Register now</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => onNavigate('tracks', '/tracks')}
                className="inline-flex items-center gap-2 border-b border-white/40 pb-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors hover:border-arcade-violet hover:text-arcade-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-violet focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink"
              >
                Explore all 19 events
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Narrative + readiness */}
      <section className="border-y border-white/10 bg-arcade-coal py-24 sm:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-arcade-violet">
                About file / Official campus file
              </p>
            </Reveal>
            <RevealHeading
              lines={[
                { text: 'The Heritage &' },
                { text: 'Campus Spirit', tone: 'violet' },
              ]}
              className="mt-6 font-display font-bold uppercase leading-[0.9] tracking-[-0.05em] text-arcade-bone"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)' }}
            />

            <Reveal className="mt-8 space-y-5 text-sm leading-relaxed text-arcade-mute sm:text-base" delay={0.12}>
              <p>
                For one day each winter, the{' '}
                <strong className="font-semibold text-arcade-bone">
                  COMSATS University Islamabad, Abbottabad Campus
                </strong>{' '}
                transforms into the beating heart of Pakistan’s student tech ecosystem. Organized by the
                CITE (Society of Information Technology &amp; Engineering), the convention unites 800+
                builders and competitors from Karachi to Khyber in the crisp mountain foothills of
                Abbottabad.
              </p>
              <p>
                Whether you are training your first machine learning model, competing in algorithmic
                challenges, or launching a civic startup, you will find a category that fits and a
                judging panel that inspects working solutions — not just pitch decks.
              </p>
            </Reveal>

            <Reveal className="mt-9 flex flex-wrap gap-2" delay={0.2}>
              {[
                { icon: GraduationCap, label: '3rd National Edition' },
                { icon: MapPin, label: 'Abbottabad, Khyber Pakhtunkhwa' },
                { icon: Users, label: '40+ Participating Universities' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 border border-white/10 bg-arcade-ink px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-arcade-bone/85"
                >
                  <Icon className="h-4 w-4 text-arcade-violet" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal className="border border-arcade-violet/40 bg-arcade-ink p-6 sm:p-7" delay={0.1}>
              <div className="flex items-start justify-between gap-4 border-b border-arcade-violet/30 pb-5">
                <div>
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-arcade-violet">
                    Competitor readiness
                  </p>
                  <p className="mt-2 font-display text-xl font-bold uppercase tracking-[-0.03em] text-arcade-bone">
                    Before you arrive.
                  </p>
                </div>
                <span className="shrink-0 border border-arcade-violet/40 bg-arcade-violet/10 px-2.5 py-1 font-display text-xs font-bold text-arcade-violet">
                  {progress}% Complete
                </span>
              </div>

              <div className="mt-5 h-1.5 w-full overflow-hidden border border-white/10 bg-arcade-coal">
                <motion.div
                  className="h-full bg-arcade-violet"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                />
              </div>

              <p className="mt-5 text-xs text-arcade-mute">Check off each item to prepare for Abbottabad.</p>

              <ul className="mt-5 space-y-3">
                {checklistItems.map((item, idx) => {
                  const isChecked = checkedItems.includes(idx);
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => toggleCheck(idx)}
                        className={`flex w-full items-start gap-3 border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-violet focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink ${
                          isChecked
                            ? 'border-arcade-violet/50 bg-arcade-violet/10 text-arcade-bone'
                            : 'border-white/10 bg-arcade-coal text-arcade-mute hover:border-white/25'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
                            isChecked
                              ? 'border-arcade-violet bg-arcade-violet text-white'
                              : 'border-white/25 bg-arcade-ink'
                          }`}
                        >
                          {isChecked && (
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.span>
                          )}
                        </span>
                        <span className={`text-xs leading-relaxed sm:text-sm ${isChecked ? 'font-semibold' : ''}`}>
                          {item}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <span className="text-xs text-arcade-mute">
                  {checkedItems.length === checklistItems.length
                    ? 'You are fully prepared for Abbottabad.'
                    : 'Check items to prepare for the event.'}
                </span>
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-[0.12em] text-arcade-lime transition-colors hover:text-white"
                >
                  Register <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Campus facts — editorial rows, not Home's folded tiles */}
      <section className="bg-arcade-ink py-24 sm:py-32">
        <div className="wrap">
          <RevealHeading
            lines={[
              { text: 'One campus.' },
              { text: 'A whole competition.', tone: 'violet' },
            ]}
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.05em] text-arcade-bone"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5.2rem)' }}
          />
          <Reveal className="mt-7 max-w-2xl font-display text-base leading-relaxed text-arcade-mute sm:text-lg" delay={0.1}>
            {event.university.name}, {event.university.campus}. A computing department, a student
            society, and a whole campus turned into a one-day competition venue.
          </Reveal>

          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {event.university.facts.map((fact, index) => {
              const Icon = factIcons[fact.icon] || GraduationCap;
              return (
                <Reveal key={fact.title} className="bg-arcade-coal p-6 sm:p-7" delay={index * 0.08}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold tabular-nums text-arcade-violet">
                      0{index + 1}
                    </span>
                    <Icon className="h-5 w-5 text-arcade-bone/60" aria-hidden="true" />
                  </div>
                  <div className="mt-8 h-px w-10 bg-arcade-violet" />
                  <h3 className="mt-5 font-display text-lg font-bold uppercase leading-tight tracking-[-0.03em] text-arcade-bone">
                    {fact.title}
                  </h3>
                  <p className="mt-3 font-display text-sm leading-relaxed text-arcade-mute">
                    {fact.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-arcade-coal py-20 sm:py-24">
        <div className="wrap">
          <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {event.stats.map(({ value, prefix = '', suffix = '', label }, index) => (
              <Reveal key={label} className="bg-arcade-ink p-7 text-center sm:p-9" delay={index * 0.08}>
                <p className="font-display text-4xl font-bold tracking-[-0.05em] text-arcade-violet sm:text-5xl">
                  {prefix}{value}{suffix}
                </p>
                <p className="mt-3 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-mute">
                  {label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-arcade-ink py-24 sm:py-32">
        <div className="wrap">
          <div className="border-l-4 border-arcade-violet bg-arcade-coal p-8 sm:p-14">
            <RevealHeading
              lines={[
                { text: 'Take your' },
                { text: 'place.', tone: 'violet' },
              ]}
              className="font-display font-bold uppercase leading-[0.86] tracking-[-0.05em] text-arcade-bone"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            />
            <Reveal className="mt-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between" delay={0.12}>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-arcade-violet">
                  {event.dateLabel} · {event.venueShort}
                </p>
                <p className="mt-2 max-w-md font-display text-sm leading-relaxed text-arcade-mute">
                  Open to degree students across Pakistan. Bring a team or find one on campus.
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 sm:items-end">
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className={ticketBase}>
                  <span>Register now</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('tracks', '/tracks')}
                  className="inline-flex items-center gap-2 border-b border-white/40 pb-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-arcade-bone transition-colors hover:border-arcade-violet hover:text-arcade-violet"
                >
                  See the event lineup
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
