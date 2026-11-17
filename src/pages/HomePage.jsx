import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Landmark,
  MapPin,
  Users,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import CountUp from '../components/CountUp.jsx';
import CountdownNote from '../components/CountdownNote.jsx';
import Reveal from '../components/Reveal.jsx';
import TornEdge from '../components/TornEdge.jsx';
import PaperPlane from '../components/PaperPlane.jsx';
import StickyNote from '../components/StickyNote.jsx';
import UniversityCard from '../components/UniversityCard.jsx';
import EventCard from '../components/EventCard.jsx';
import { event } from '../data/event.js';
import { events } from '../data/tracks.js';

// ── Thumbtack SVG (decorative pin holding the hero card) ──
function Thumbtack({ className = '' }) {
  return (
    <svg className={`w-7 h-7 ${className}`} viewBox="0 0 28 36" fill="none">
      <circle cx="14" cy="12" r="10" fill="#C0392B" stroke="#922B21" strokeWidth="1.2" />
      <circle cx="11" cy="9"  r="3"  fill="rgba(255,255,255,0.3)" />
      <line   x1="14" y1="22" x2="14" y2="36" stroke="#7F8C8D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function HandUnderline({ className = '' }) {
  const reduced = useReducedMotion();

  return (
    <svg className={`w-full max-w-[420px] h-5 ${className}`} viewBox="0 0 420 20" preserveAspectRatio="none" fill="none">
      <motion.path
        d="M2,12 C40,2 80,18 120,10 C160,2 200,18 240,10 C280,2 320,18 360,10 C390,4 408,14 418,8"
        stroke="#D4AF65"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.75"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: reduced ? 0 : 0.28, duration: reduced ? 0.12 : 0.62, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

// ── Marker / highlighter stroke beneath the date ──
function MarkerUnderline({ children, className = '' }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden="true"
        className="absolute left-0 -bottom-1.5 h-3 w-full pointer-events-none"
        viewBox="0 0 300 14"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M3 9.5 C52 5 104 11.5 156 8 S252 5 297 9"
          stroke="#D4AF65"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M8 11 C60 7.5 108 13 162 10 S256 7.5 292 11"
          stroke="#E5D6BA"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </span>
  );
}

const universityIcons = {
  GraduationCap,
  Landmark,
};

export default function HomePage({ onNavigate }) {
  const reduced = useReducedMotion();
  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <div className="pb-24">
      {/* ======================================================================
          HERO — Bulletin-board / Campus Noticeboard vibe
          Navy canvas with subtle ruled notebook lines, cork-texture overlay,
          dramatic ghost watermark, thumbtack, hand-drawn underline, marker date.
      ====================================================================== */}
      <section className="relative overflow-hidden pt-14 pb-24 sm:pt-20 sm:pb-32 md:pt-24 md:pb-40 bg-[#101F38]">

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <picture className="block h-full w-full">
            <source srcSet="/Hero%20Backgroound.webp" type="image/webp" />
            <img
              src="/Hero%20Backgroound.jpg"
              alt=""
              width="1600"
              height="844"
              className="h-full w-full object-cover object-center opacity-25"
              loading="eager"
              decoding="async"
            />
          </picture>
          <div className="absolute inset-0 bg-[#101F38]/25" />
        </div>

        {/* ── Subtle notebook-ruled lines background ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #E5D6BA 31px, #E5D6BA 32px)',
          }}
        />

        {/* ── Cork/bulletin board texture vignette ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 55%, rgba(7,16,30,0.5) 100%)',
          }}
        />

        {/* ── Scattered decorative doodle stars ── */}
        {[
          { top: '12%', left: '8%',  size: 18, rot: 15,  op: 0.25 },
          { top: '20%', left: '88%', size: 14, rot: -20, op: 0.20 },
          { top: '65%', left: '5%',  size: 10, rot: 30,  op: 0.18 },
          { top: '75%', left: '90%', size: 16, rot: -10, op: 0.22 },
          { top: '40%', left: '93%', size: 12, rot: 45,  op: 0.17 },
        ].map((s, i) => (
          <svg
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute z-0"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.op, transform: `rotate(${s.rot}deg)` }}
            viewBox="0 0 24 24"
            fill="#E5D6BA"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        ))}

        {/* ── Paper plane soaring across top-right ── */}
        <div className="absolute right-6 sm:right-16 md:right-28 top-20 sm:top-24 z-20 hidden sm:block">
          <PaperPlane size="lg" />
        </div>

        {/* ── Second small paper plane bottom-left ── */}
        <div
          className="absolute left-6 sm:left-14 bottom-28 z-20 hidden md:block"
          style={{ transform: 'rotate(180deg) scaleX(-1)' }}
        >
          <PaperPlane size="sm" flightTrail={false} />
        </div>

        {/* ── Thumbtack holding the title area ── */}
        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 hidden sm:block">
          <Thumbtack />
        </div>

        <motion.div
          className="wrap relative z-10 text-center"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: 0.04 } } }}
        >
          <motion.div variants={item}>
            <p className="font-nastaliq text-2xl sm:text-3xl md:text-4xl text-sand-400 mb-3 leading-loose drop-shadow-sm">
              تعمیرِ نو کی ایک نئی پرواز
            </p>
          </motion.div>

          <motion.div variants={item} className="relative inline-block">
            <motion.h1
              className="font-display font-black uppercase tracking-tight text-sand-100 leading-[0.92]"
              style={{ fontSize: 'clamp(3.8rem, 12vw, 8.5rem)' }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: 26 }}
              animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }}
              transition={{ delay: reduced ? 0.1 : 0.12, duration: reduced ? 0.2 : 0.62, ease: [0.16, 1, 0.3, 1] }}
            >
              CITE<span className="text-sand-400">'26</span>
            </motion.h1>
            <div className="mt-1 flex justify-center">
              <HandUnderline />
            </div>
          </motion.div>

          <motion.div variants={item}>
            <p className="mt-5 font-serif italic text-lg sm:text-xl md:text-2xl text-sand-300 font-normal max-w-2xl mx-auto leading-snug">
              COMSATS University Abbottabad&apos;s flagship national tech &amp; engineering convention
            </p>
          </motion.div>

          <motion.div variants={item} className="mt-8 inline-block">
            <MarkerUnderline>
              <span className="block font-display text-2xl sm:text-3xl md:text-[2.4rem] font-extrabold tracking-widest text-sand-100 px-4">
                12 DECEMBER 2026
              </span>
            </MarkerUnderline>
            <p className="mt-3 font-mono text-xs sm:text-sm text-sand-300/80 font-medium">
              COMSATS University Islamabad, Abbottabad Campus
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-sand-300/70">
              {event.university.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded border border-navy-700/60 bg-navy-850/60 px-2 py-1"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-col items-center justify-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="w-full sm:w-auto"
              >
                Register Now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={() => onNavigate('tracks', '#/tracks')}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Explore Competitions &amp; Tracks
              </Button>
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex justify-center opacity-70">
            <svg className="h-7 w-16 text-sand-400/50" viewBox="0 0 100 40" fill="currentColor" aria-hidden="true">
              <path d="M50 0 C45 10 40 20 20 25 C40 25 45 35 50 40 C55 35 60 25 80 25 C60 20 55 10 50 0 Z" />
              <circle cx="50" cy="20" r="3" fill="#D4AF65" />
              <circle cx="35" cy="23" r="2" fill="#D4AF65" />
              <circle cx="65" cy="23" r="2" fill="#D4AF65" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Torn paper edge */}
        <div className="absolute inset-x-0 bottom-0">
          <TornEdge position="bottom" fill="#07101E" />
        </div>
      </section>

      {/* ======================================================================
          QUICK STATS RIBBON
      ====================================================================== */}
      <section className="relative bg-navy-950 py-10">
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            {event.stats.map(({ value, prefix = '', suffix = '', label }) => (
              <div key={label} className="p-3">
                <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-sand-300">
                  <CountUp end={value} prefix={prefix} suffix={suffix} />
                </p>
                <p className="mt-1 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-ivory-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <TornEdge position="bottom" fill="#0E2342" />
        </div>
      </section>

      {/* ======================================================================
          HOST UNIVERSITY
      ====================================================================== */}
      <section className="relative py-16 sm:py-24 bg-navy-850">
        <div className="wrap">
          <div className="grid gap-8 lg:grid-cols-12 items-stretch">
            {/* University identity card */}
            <UniversityCard
              tone="paper"
              label="UNIVERSITY FILE"
              code="CUI / ABT · 2001"
              className="lg:col-span-5"
              ruled
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy-950 leading-tight">
                COMSATS University Islamabad
              </h2>
              <p className="mt-1 font-serif italic text-lg text-navy-800">Abbottabad Campus</p>

              <p className="mt-4 text-sm text-navy-800/80 leading-relaxed">
                Set in the mountain foothills of Abbottabad, the campus brings together the
                Department of Computer Science, the CITE Society, and a thriving student
                innovation ecosystem — the home ground for CITE&apos;26.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-navy-800/25 bg-navy-900/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-navy-800">
                  <MapPin className="h-3.5 w-3.5" />
                  Abbottabad, KP
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-navy-800/25 bg-navy-900/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-navy-800">
                  <Landmark className="h-3.5 w-3.5" />
                  Est. {event.university.established}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-navy-800/25 bg-navy-900/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-navy-800">
                  <Users className="h-3.5 w-3.5" />
                  40+ Universities
                </span>
              </div>

              <div className="mt-6 border-t border-navy-800/15 pt-4">
                <button
                  type="button"
                  onClick={() => onNavigate('about', '#/about')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-navy-900 hover:text-navy-700 transition-colors"
                >
                  <span>Read the campus story</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </UniversityCard>

            {/* Campus facts grid */}
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              {event.university.facts.map((fact, i) => {
                const Icon = universityIcons[fact.icon] || GraduationCap;
                return (
                  <UniversityCard
                    key={fact.title}
                    variant="compact"
                    label={`CAMPUS FILE · 0${i + 1}`}
                    code="CUI / ABT"
                    showCrest={false}
                    className="h-full"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] border border-sand-400/30 bg-navy-750 text-sand-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="font-display text-sm font-bold text-ivory">{fact.title}</h3>
                    </div>
                    <p className="mt-2 text-xs text-ivory-muted leading-relaxed">
                      {fact.description}
                    </p>
                  </UniversityCard>
                );
              })}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <TornEdge position="bottom" fill="#0B1B33" />
        </div>
      </section>

      {/* ======================================================================
          COUNTDOWN & STICKY NOTES
      ====================================================================== */}
      <section className="relative py-16 sm:py-24 bg-navy-900">
        <div className="wrap max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="relative lg:col-span-8">
              <CountdownNote />
            </div>

            {/* Sticky notes column */}
            <div className="lg:col-span-4 space-y-6">
              <StickyNote title="Campus Packing Tip" color="sand" rotate="2.5deg">
                Abbottabad in December is chilly! Pack warm hoodies and jackets.
              </StickyNote>
              <StickyNote title="Coming Solo?" color="blue" rotate="-3deg">
                No squad? No worries! Over 30% of participants register solo. We run an on-campus team-formation session right after the keynote.
              </StickyNote>
              <StickyNote title="Pro Tip 🎯" color="green" rotate="1.5deg">
                Attend every workshop — they are built to help you sharpen your project.
              </StickyNote>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <TornEdge position="bottom" fill="#0E2342" />
        </div>
      </section>

      {/* ======================================================================
          TRACKS PREVIEW
      ====================================================================== */}
      <section className="relative py-16 sm:py-24 bg-navy-850">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">Competitions &amp; Challenges</span>
              <h2 className="mt-2 font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-ivory">Featured Events</h2>
              <p className="mt-1 text-sm text-ivory-muted">19 competitions across two arenas — coding, design, gaming, and more.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tracks', '#/tracks')}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-sand-300 hover:text-white transition-colors"
            >
              <span>View All 19 Events</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((item, i) => (
              <EventCard
                key={item.name}
                event={item}
                index={i}
                onNavigate={() => onNavigate('tracks', '#/tracks')}
                actionLabel="View all events"
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <TornEdge position="bottom" fill="#0B1B33" />
        </div>
      </section>

      {/* ======================================================================
          CLOSING CTA
      ====================================================================== */}
      <section className="py-20 bg-navy-950 text-center relative overflow-hidden">
        <div className="wrap max-w-2xl relative z-10">
          <div className="flex justify-center mb-5">
            <PaperPlane flightTrail={false} size="lg" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase text-sand-200">
            Ready to Compete in Abbottabad?
          </h2>
          <p className="mt-3 text-sm text-ivory-muted leading-relaxed">
            Whether you&apos;re building your first project or shipping your next startup, CITE&apos;26 is where you belong. Open to degree students across Pakistan.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href={event.registrationUrl} target="_blank" rel="noopener noreferrer" size="lg">
              Register Your Team
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
