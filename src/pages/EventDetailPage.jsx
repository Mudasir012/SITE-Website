import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Calendar, Clock, Mail, MapPin, ShieldCheck, Trophy, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { event as siteEvent } from '../data/event.js';
import { getEventBySlug } from '../data/tracks.js';
import { publicService } from '../lib/supabase';
import RegistrationModal from '../components/RegistrationModal.jsx';

export default function EventDetailPage({ slug, onNavigate }) {
  const reduced = useReducedMotion();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const item = getEventBySlug(slug);

  // The admin controls the registration window from the portal. Keep the
  // public button closed unless the setting explicitly says otherwise.
  useEffect(() => {
    let active = true;
    publicService
      .getSettings()
      .then((settings) => {
        if (active) setRegistrationOpen(Boolean(settings?.registration_open));
      })
      .catch(() => {
        if (active) setRegistrationOpen(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openRegistration = () => {
    if (registrationOpen) setRegisterOpen(true);
  };

  if (!item) {
    return (
      <div className="min-h-[70vh] bg-arcade-ink py-24 font-display text-arcade-bone">
        <div className="wrap text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-arcade-lime">Event not found</p>
          <h1 className="mt-4 text-3xl font-bold uppercase tracking-[-0.04em] sm:text-5xl">
            Competition Unavailable
          </h1>
          <button
            type="button"
            onClick={() => onNavigate('tracks', '/tracks')}
            className="mt-8 inline-flex items-center gap-2 bg-arcade-lime px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all 18 events
          </button>
        </div>
      </div>
    );
  }

  const isTrackA = item.code === 'A';
  const accentText = isTrackA ? 'text-arcade-violet' : 'text-arcade-limeHot';
  const accentBg = isTrackA ? 'bg-arcade-violet text-white' : 'bg-arcade-limeHot text-white';
  const accentBorder = isTrackA ? 'border-arcade-violet/40' : 'border-arcade-limeHot/40';

  const infoTiles = [
    { label: 'Fee', value: item.fee, icon: ShieldCheck },
    { label: 'Team Size', value: item.teamSize, icon: Users },
    { label: 'Winner Prize', value: item.winnerPrize, icon: Trophy },
    { label: 'Runner-up Prize', value: item.runnerUpPrize, icon: Trophy },
    { label: 'Venue', value: item.venue, icon: MapPin },
    { label: 'Timings', value: item.timings, icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-arcade-ink pb-24 pt-10 font-display text-arcade-bone sm:pt-14">
      <div className="wrap">
        {/* Back link */}
        <button
          type="button"
          onClick={() => onNavigate('tracks', '/tracks')}
          className="inline-flex items-center gap-2 border-b border-white/25 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-arcade-mute transition-colors hover:border-arcade-lime hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All 18 events
        </button>

        {/* Hero header */}
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-12 lg:items-center"
        >
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${accentBg}`}>
                {item.category}
              </span>
              <span className="border border-arcade-lime/50 bg-arcade-lime/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-lime">
                {item.status}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-arcade-mute">
                ID: {item.eventCode}
              </span>
            </div>

            <h1
              className="mt-5 font-bold uppercase leading-[0.88] tracking-[-0.055em] text-arcade-bone"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.8rem)' }}
            >
              {item.name}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-arcade-mute">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
                Duration: <strong className="text-arcade-bone">{item.duration}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-arcade-lime" aria-hidden="true" />
                Team size: <strong className="text-arcade-bone">{item.teamSize}</strong>
              </span>
            </div>

            {item.roles?.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                  Recommended team roles
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {item.roles.map((role) => (
                    <span
                      key={role}
                      className="border border-white/15 bg-arcade-coal px-3 py-1 text-xs font-semibold text-arcade-bone"
                    >
                      • {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-arcade-bone/85 sm:text-lg">
              {item.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={openRegistration}
                disabled={!registrationOpen}
                className={
                  registrationOpen
                    ? 'group inline-flex items-center justify-center gap-3 bg-arcade-lime px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-ink'
                    : 'inline-flex cursor-not-allowed items-center justify-center border border-white/20 bg-arcade-coal px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-mute'
                }
              >
                {registrationOpen ? (
                  <>
                    Register Now
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  'Registration not open'
                )}
              </button>
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-arcade-mute">
                Fee: {item.fee}
              </span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="relative aspect-[4/3] overflow-hidden border border-white/15 bg-arcade-coal">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover opacity-85"
              />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-arcade-ink/80 via-transparent to-transparent" />
              <span className={`absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${accentBg}`}>
                {item.eventCode}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Breakdown */}
        <section className="border-b border-white/10 py-12">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${accentText}`}>
            Event flow
          </p>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] sm:text-3xl">
            Breakdown
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {item.breakdown.map((step, idx) => (
              <div
                key={step.title}
                className={`border bg-arcade-coal p-5 ${accentBorder}`}
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
                  0{idx + 1} · {step.phase}
                </span>
                <p className="mt-2.5 text-sm font-bold uppercase leading-snug text-arcade-bone">
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Details Grid */}
        <section className="border-b border-white/10 py-12">
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {infoTiles.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-arcade-coal p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-mute">
                    {label}
                  </span>
                  <Icon className="h-4 w-4 text-arcade-lime" aria-hidden="true" />
                </div>
                <p className="mt-3 text-lg font-bold tracking-[-0.02em] text-arcade-bone">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Rules + Inquiries */}
        <section className="grid gap-12 pt-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${accentText}`}>
              Guidelines
            </p>
            <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] sm:text-3xl">
              Rules
            </h2>
            <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {item.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-4 py-4">
                  <span className="mt-0.5 shrink-0 font-mono text-xs font-bold tabular-nums text-arcade-lime">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm leading-relaxed text-arcade-bone/85 sm:text-base">
                    {rule}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="border border-white/15 bg-arcade-coal p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
                  Event Inquiries & Contact
                </p>
                <p className="mt-3 text-sm leading-relaxed text-arcade-mute">
                  Questions about rules, equipment, or eligibility for {item.name}? Reach out to the organizing committee.
                </p>
                <a
                  href={`mailto:${item.contactEmail}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-arcade-bone transition-colors hover:text-arcade-lime"
                >
                  <Mail className="h-4 w-4 text-arcade-lime" aria-hidden="true" />
                  {item.contactEmail}
                </a>
              </div>

              <div className="border border-white/15 bg-arcade-coal p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-lime">
                  Registration
                </p>
                <p className="mt-2 text-lg font-bold uppercase text-arcade-bone">
                  {item.status}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-arcade-mute">
                  Reserve your spot for {item.name}. Every entry is reviewed by the CITE organizing
                  committee before confirmation.
                </p>
                <button
                  type="button"
                  onClick={openRegistration}
                  disabled={!registrationOpen}
                  className={
                    registrationOpen
                      ? 'group mt-5 inline-flex w-full items-center justify-center gap-2 bg-arcade-lime px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal'
                      : 'mt-5 inline-flex w-full cursor-not-allowed items-center justify-center border border-white/20 bg-arcade-coal px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-mute'
                  }
                >
                  {registrationOpen ? (
                    <>
                      Register Now
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    'Registration not open'
                  )}
                </button>
                <a
                  href={siteEvent.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-white/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-arcade-bone transition-colors hover:border-arcade-lime hover:text-arcade-lime"
                >
                  Become a Campus Ambassador
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <RegistrationModal
        open={registerOpen}
        event={item}
        onClose={() => setRegisterOpen(false)}
      />
    </div>
  );
}
