import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Ticket } from 'lucide-react';
import { Reveal, RevealHeading } from '../components/ScrollReveal.jsx';
import { event } from '../data/event.js';
import { events } from '../data/tracks.js';
import { eventSchedule } from '../data/schedule.js';
import HERO_SLIDES from 'virtual:slideshow-images';

const pad = (value) => String(value).padStart(2, '0');

const featuredEvents = [events[0], events[9], events[4], events[2], events[10], events[14]].filter(Boolean);

const dayMoments = [
  eventSchedule.sessions.find((session) => session.title.startsWith('Registration')),
  eventSchedule.sessions.find((session) => session.title.startsWith('Team Formation')),
  eventSchedule.sessions.find((session) => session.title.startsWith('Competitions Officially')),
  eventSchedule.sessions.find((session) => session.title.startsWith('Grand Finale')),
].filter(Boolean);

function useCountdown(target) {
  const read = () => {
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
  };

  const [remaining, setRemaining] = useState(read);

  useEffect(() => {
    setRemaining(read());
    const id = setInterval(() => setRemaining(read()), 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

function RouteRail() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.3 });

  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-10 left-7 top-28 z-40 hidden w-3 xl:block">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10">
        <motion.div style={{ scaleY }} className="h-full w-full origin-top bg-arcade-lime" />
      </div>
      {[0.18, 0.46, 0.74].map((point) => (
        <span
          key={point}
          className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-arcade-lime bg-arcade-ink"
          style={{ top: `${point * 100}%` }}
        />
      ))}
    </div>
  );
}

const ticketBase =
  'group relative inline-flex items-center justify-center gap-3 bg-arcade-lime px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink shadow-[0_18px_45px_-22px_rgba(0,0,0,0.95)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink';

function TicketLink({ href, children, className = '' }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${ticketBase} ${className}`}>
      <span aria-hidden="true" className="absolute -left-1 top-1/2 h-5 w-2 -translate-y-1/2 rounded-full bg-arcade-ink" />
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </a>
  );
}

function HeroPass() {
  const reduced = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [11, -11]), { stiffness: 170, damping: 18 });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-17, 17]), { stiffness: 170, damping: 18 });

  const handleMove = (event) => {
    if (reduced) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className="relative hidden h-[500px] w-[350px] shrink-0 [perspective:1200px] lg:block"
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="h-full w-full"
      >
        <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative h-full w-full">
          <div
            className="absolute inset-0 border border-white/15 bg-arcade-coal shadow-[0_45px_90px_-40px_rgba(0,0,0,0.95)]"
            style={{ transform: 'translateZ(0px)' }}
          />
          <div
            className="absolute inset-x-0 top-0 flex h-20 items-center justify-between border-b border-black/30 bg-arcade-lime py-0 pl-5 pr-20 text-arcade-ink"
            style={{ transform: 'translateZ(18px)' }}
          >
            <span className="flex h-11 items-center justify-center bg-arcade-ink px-2.5">
              <img
                src="/CITE_New_Logo_White.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-7 w-auto object-contain"
              />
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.22em]">Student pass</span>
          </div>
          <div className="absolute inset-x-6 top-28 h-px bg-white/15" style={{ transform: 'translateZ(30px)' }} />
          <div className="absolute inset-x-6 top-36" style={{ transform: 'translateZ(38px)' }}>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-arcade-lime">Admit one</p>
            <p className="mt-3 font-display text-4xl font-bold uppercase leading-[0.94] tracking-[-0.05em] text-arcade-bone">
              One day.
              <br />
              Eighteen
              <br />
              chances.
            </p>
          </div>
          <div className="absolute inset-x-6 top-[310px] flex items-center justify-between border-t border-white/15 pt-4" style={{ transform: 'translateZ(34px)' }}>
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-arcade-mute">Date</p>
              <p className="mt-1 font-display text-sm font-bold uppercase text-arcade-bone">12 Dec 2026</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-arcade-mute">Venue</p>
              <p className="mt-1 font-display text-sm font-bold uppercase text-arcade-bone">CUI Abbottabad</p>
            </div>
          </div>
          <div className="absolute inset-x-6 bottom-6 flex h-9 items-end gap-[3px]" style={{ transform: 'translateZ(42px)' }} aria-hidden="true">
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3].map((width, index) => (
              <span key={index} className="h-full bg-arcade-bone/80" style={{ width }} />
            ))}
          </div>
          <div
            className="absolute right-0 top-0 grid h-16 w-16 place-items-center border-b border-l border-arcade-lime/40 bg-arcade-ink text-arcade-bone"
            style={{ transform: 'translateZ(46px)' }}
          >
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CountdownStrip() {
  const remaining = useCountdown(event.startDate);
  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Minutes', value: remaining.minutes },
    { label: 'Seconds', value: remaining.seconds },
  ];

  if (remaining.done) {
    return (
      <div role="status" className="inline-flex items-center gap-3 border border-arcade-limeHot/40 bg-arcade-limeHot/10 px-5 py-3">
        <span className="h-2 w-2 rotate-45 bg-arcade-limeHot" aria-hidden="true" />
        <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-arcade-limeHot">Competitions are live</span>
      </div>
    );
  }

  return (
    <div role="timer" aria-label="Countdown to CITE 2026" className="grid max-w-lg grid-cols-4 gap-3 sm:gap-5">
      {units.map(({ label, value }) => (
        <div key={label} className="border-t border-white/20 pt-3">
          <span className="block font-display text-3xl font-bold tabular-nums tracking-[-0.04em] text-arcade-bone sm:text-4xl">
            {pad(value)}
          </span>
          <span className="mt-1 block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DayRoute({ onNavigate }) {
  const reduced = useReducedMotion();

  return (
    <section className="bg-arcade-coal py-24 sm:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <RevealHeading
            lines={[
              { text: 'One day.' },
              { text: 'Eighteen ways', accent: true },
              { text: 'to win.' },
            ]}
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.05em] text-arcade-bone"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
          />
          <Reveal className="mt-7 max-w-xl font-display text-base leading-relaxed text-arcade-mute sm:text-lg" delay={0.12}>
            Check in at eight, form a team, choose an arena, and ship something real before the
            final showcase at six. Every hour has a purpose.
          </Reveal>
          <Reveal className="mt-10" delay={0.2}>
            <CountdownStrip />
          </Reveal>
        </div>

        <div className="lg:col-span-6">
          <div className="relative border-l border-white/15 pl-8 sm:pl-10">
            {dayMoments.map((moment, index) => (
              <motion.div
                key={moment.time}
                initial={reduced ? undefined : { opacity: 0, x: 20 }}
                whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="relative pb-10 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[41px] top-1.5 h-3 w-3 rotate-45 border border-arcade-lime bg-arcade-coal sm:-left-[49px]"
                />
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <span className="font-display text-2xl font-bold tabular-nums tracking-[-0.03em] text-arcade-lime sm:text-3xl">
                    {moment.time}
                  </span>
                  <h3 className="font-display text-base font-bold uppercase tracking-[-0.01em] text-arcade-bone sm:text-lg">
                    {moment.title}
                  </h3>
                </div>
                <p className="mt-1 font-display text-sm text-arcade-mute">{moment.location}</p>
              </motion.div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('schedule', '/schedule')}
            className="mt-10 inline-flex items-center gap-2 border-b border-arcade-lime pb-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal"
          >
            See the full schedule
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

const arenaTileClasses = [
  'sm:col-span-1 lg:col-span-7 lg:-rotate-2',
  'sm:col-span-1 lg:col-span-5 lg:mt-12 lg:rotate-2',
  'sm:col-span-1 lg:col-span-5 lg:-mt-6 lg:rotate-2',
  'sm:col-span-1 lg:col-span-7 lg:mt-6 lg:-rotate-1',
  'sm:col-span-1 lg:col-span-7 lg:rotate-1',
  'sm:col-span-1 lg:col-span-5 lg:mt-10 lg:-rotate-2',
];

function ArenaSection({ onNavigate }) {
  const reduced = useReducedMotion();

  return (
    <section className="overflow-hidden bg-arcade-ink py-24 sm:py-32">
      <div className="wrap">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <RevealHeading
            lines={[{ text: 'Choose your arena.' }]}
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.05em] text-arcade-bone"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
          />
          <Reveal delay={0.12}>
            <button
              type="button"
              onClick={() => onNavigate('tracks', '/tracks')}
              className="inline-flex items-center gap-2 self-start border-b border-arcade-lime pb-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink lg:self-auto"
            >
              View all 18 events
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12 [perspective:1200px]">
          {featuredEvents.map((item, index) => (
            <motion.button
              key={item.name}
              type="button"
              onClick={() => onNavigate('tracks', '/tracks')}
              whileHover={reduced ? undefined : { rotateY: 5, rotateX: -4, y: -8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className={`group relative col-span-1 min-h-[230px] overflow-hidden border border-white/10 bg-arcade-coal text-left shadow-[0_28px_60px_-34px_rgba(0,0,0,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink sm:min-h-[280px] lg:min-h-[320px] ${arenaTileClasses[index]}`}
            >
              <motion.div
                initial={reduced ? undefined : { clipPath: 'inset(14% 0 0 0)' }}
                whileInView={reduced ? undefined : { clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, delay: (index % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-65 transition-transform duration-500 group-hover:scale-105"
                />
              </motion.div>
              <span aria-hidden="true" className="absolute inset-0 bg-arcade-ink/35" />
              <span className="relative flex h-full min-h-[230px] flex-col justify-between p-4 sm:min-h-[280px] sm:p-5 lg:min-h-[320px]" style={{ transform: 'translateZ(28px)' }}>
                <span
                  className={`inline-flex w-fit px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-[0.18em] ${
                    item.code === 'A' ? 'bg-arcade-violet text-white' : 'bg-arcade-limeHot text-white'
                  }`}
                >
                  {item.code === 'A' ? 'Computer science' : 'Fun & esports'}
                </span>
                <span>
                  <span className="block font-display text-xl font-bold uppercase leading-[0.95] tracking-[-0.04em] text-arcade-bone sm:text-2xl">
                    {item.name}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-bone/70 transition-colors group-hover:text-arcade-lime">
                    Explore event
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampusSection({ onNavigate }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const fold = useTransform(scrollYProgress, [0, 0.5, 1], [-14, 0, 9]);
  const accents = ['bg-arcade-lime', 'bg-arcade-violet', 'bg-arcade-limeHot'];

  return (
    <section ref={sectionRef} className="bg-arcade-coal py-24 sm:py-32">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <RevealHeading
            lines={[{ text: 'Built on a real campus.' }]}
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.05em] text-arcade-bone"
            style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)' }}
          />
          <Reveal className="mt-7 max-w-lg font-display text-base leading-relaxed text-arcade-mute sm:text-lg" delay={0.1}>
            {event.university.name}, {event.university.campus}. A computing department, a
            student society, and a whole campus turned into a one-day competition venue.
          </Reveal>
          <Reveal className="mt-4" delay={0.16}>
            <p className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-arcade-bone/80">
              <MapPin className="h-4 w-4 text-arcade-lime" aria-hidden="true" />
              {event.city}
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <button
              type="button"
              onClick={() => onNavigate('about', '/about')}
              className="mt-9 inline-flex items-center gap-2 border-b border-arcade-lime pb-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal"
            >
              Read the campus story
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </Reveal>
        </div>

        <div className="lg:col-span-7 [perspective:1200px]">
          <motion.div
            style={reduced ? undefined : { rotateX: fold, transformStyle: 'preserve-3d' }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {event.university.facts.map((fact, index) => (
              <div
                key={fact.title}
                className="relative flex min-h-[250px] flex-col border border-white/10 bg-arcade-ink p-5 shadow-[0_24px_55px_-30px_rgba(0,0,0,0.95)]"
                style={reduced ? undefined : { transform: `translateZ(${index * 20}px)` }}
              >
                <span aria-hidden="true" className={`h-1.5 w-10 ${accents[index % accents.length]}`} />
                <h3 className="mt-6 font-display text-lg font-bold uppercase leading-tight tracking-[-0.03em] text-arcade-bone">
                  {fact.title}
                </h3>
                <p className="mt-3 font-display text-sm leading-relaxed text-arcade-mute">{fact.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="bg-arcade-ink py-24 sm:py-32">
      <div className="wrap">
        <div className="relative border border-white/10 bg-arcade-coal p-7 sm:p-12">
          <span aria-hidden="true" className="absolute -right-5 -top-5 h-20 w-20 rotate-12 bg-arcade-lime" />
          <div className="grid gap-10 lg:grid-cols-[1fr_350px] lg:items-center">
            <div>
              <RevealHeading
                lines={[{ text: 'Ready' }, { text: 'to enter?' }]}
                className="font-display font-bold uppercase leading-[0.86] tracking-[-0.05em] text-arcade-bone"
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
              />
              <Reveal className="mt-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between" delay={0.12}>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-arcade-lime">
                    12 December 2026 · {event.venueShort}
                  </p>
                  <p className="mt-2 max-w-md font-display text-sm leading-relaxed text-arcade-mute">
                    Open to degree students across Pakistan. Bring a team or find one on campus.
                  </p>
                </div>
                <TicketLink href={event.registrationUrl} className="shrink-0">
                  Register as an Ambassador
                </TicketLink>
              </Reveal>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroPass />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ onNavigate }) {
  const reduced = useReducedMotion();
  const [slideIndex, setSlideIndex] = useState(0);
  const { scrollY } = useScroll();
  const heroMediaY = useTransform(scrollY, [0, 700], [0, 60]);
  const heroCopyY = useTransform(scrollY, [0, 600], [0, -48]);
  const heroCopyOpacity = useTransform(scrollY, [0, 450], [1, 0.4]);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return undefined;
    const id = setInterval(() => {
      setSlideIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <div className="bg-arcade-ink font-display text-arcade-bone">
      <RouteRail />

      <section className="relative isolate flex min-h-[calc(100svh-4rem)] overflow-hidden bg-arcade-ink sm:min-h-[calc(100svh-4.5rem)]">
        <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
          {HERO_SLIDES.map((src, index) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={reduced ? undefined : { y: heroMediaY }}
              initial={false}
              animate={{
                opacity: index === slideIndex ? 1 : 0,
                scale: reduced ? 1.05 : index === slideIndex ? 1.08 : 1.14,
              }}
              transition={{
                opacity: { duration: 1.2, ease: 'easeInOut' },
                scale: { duration: 6, ease: 'easeOut' },
              }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/75" />

        <motion.div
          className="wrap relative z-10 flex min-h-[calc(100svh-4rem)] w-full flex-col justify-between pb-0 pt-8 sm:min-h-[calc(100svh-4.5rem)] sm:pt-10"
          style={reduced ? undefined : { y: heroCopyY, opacity: heroCopyOpacity }}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.11, delayChildren: reduced ? 0 : 0.1 } } }}
        >
          <motion.div variants={item} className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-arcade-lime">
                Pakistan&apos;s national student tech convention
              </p>
              <p className="mt-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-arcade-bone/70 sm:text-sm">
                {event.venue}
              </p>
            </div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-arcade-mute">
              COMSATS · Abbottabad · 2026
            </p>
          </motion.div>

          <div className="py-8 sm:py-10 lg:py-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <motion.h1
                variants={item}
                className="font-display font-bold uppercase leading-[0.78] tracking-[-0.06em] text-arcade-bone"
                style={{ fontSize: 'clamp(4.5rem, 14vw, 11rem)' }}
              >
                CITE<span className="text-arcade-lime">&apos;26</span>
              </motion.h1>

              <motion.div
                variants={item}
                className="hidden shrink-0 flex-col items-end gap-2 border-l border-white/20 pl-8 lg:flex"
              >
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-arcade-lime">
                  One day only
                </span>
                <span className="font-display text-5xl font-bold tabular-nums tracking-[-0.06em] text-arcade-bone xl:text-6xl">
                  12.12.26
                </span>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                  Eighteen competitions
                </span>
              </motion.div>
            </div>

            <motion.div variants={item} className="mt-8">
              <button
                type="button"
                onClick={() => onNavigate('tracks', '/tracks')}
                className="inline-flex items-center gap-2 border-b border-white/40 pb-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-bone transition-colors hover:border-arcade-lime hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink"
              >
                Explore all 18 events
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          </div>

          <motion.div
            variants={item}
            className="grid grid-cols-2 border-t border-white/20 lg:grid-cols-4"
          >
            {[
              { label: 'Date', value: '12 Dec 2026' },
              { label: 'Campus', value: 'CUI Abbottabad' },
              { label: 'Events', value: '18 competitions' },
            ].map((fact) => (
              <div key={fact.label} className="border-b border-white/20 px-1 py-3.5 sm:px-4 sm:py-4 lg:border-b-0 lg:border-r">
                <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                  {fact.label}
                </p>
                <p className="mt-2 font-display text-sm font-bold uppercase tracking-[-0.01em] text-arcade-bone sm:text-base">
                  {fact.value}
                </p>
              </div>
            ))}
            <div className="col-span-2 flex items-center justify-start px-1 py-3.5 sm:px-4 sm:py-4 lg:col-span-1 lg:border-b-0 lg:justify-end">
              <TicketLink href={event.registrationUrl}>Register as an Ambassador</TicketLink>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <DayRoute onNavigate={onNavigate} />
      <ArenaSection onNavigate={onNavigate} />
      <CampusSection onNavigate={onNavigate} />
      <ClosingCTA />
    </div>
  );
}
