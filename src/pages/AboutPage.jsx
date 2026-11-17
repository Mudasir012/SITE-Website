import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, MapPin, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import Button from '../components/Button.jsx';
import TornEdge from '../components/TornEdge.jsx';
import PaperPlane from '../components/PaperPlane.jsx';
import UniversityCard from '../components/UniversityCard.jsx';
import WashiTape from '../components/WashiTape.jsx';
import { event } from '../data/event.js';

const checklistItems = [
  'Form a team of 2–4 builders (solo registrants get matched on the day)',
  'Pick an event from our 19-competition lineup',
  'Pack your laptop, chargers, and valid student ID card or CNIC',
];

export default function AboutPage({ onNavigate }) {
  const [checkedItems, setCheckedItems] = useState([0, 1]);

  const toggleCheck = (idx) => {
    setCheckedItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const progress = Math.round((checkedItems.length / checklistItems.length) * 100);

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <div className="relative">
          {/* Paper airplane accent in corner */}
          <div className="absolute right-0 top-0 hidden md:block">
            <PaperPlane flightTrail={false} />
          </div>

          <SectionHeading
            as="h1"
            motto="علم و ہنر کا سنگم — قومی شناخت"
            title="About CITE 2026"
            subtitle="Where Ambition Meets Opportunity at CUI Abbottabad"
            description="CITE 2026 is COMSATS University Abbottabad’s flagship national student competition &amp; tech convention — organized by students, for students."
          />
        </div>

        {/* Narrative Grid */}
        <div className="grid gap-10 lg:grid-cols-12 items-start mt-12">
          {/* Story Column */}
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base leading-relaxed text-ivory-muted">
            <UniversityCard
              label="ABOUT FILE"
              eyebrow="OFFICIAL CAMPUS FILE"
              sub="CITE'26 · Heritage & Spirit"
              code="CUI / ABT"
            >
              <h3 className="font-display text-xl font-bold text-ivory mb-4">
                The Heritage &amp; Campus Spirit
              </h3>
              <p>
                For one day each winter, the{' '}
                <strong className="text-sand-300 font-semibold">
                  COMSATS University Islamabad, Abbottabad Campus
                </strong>{' '}
                transforms into the beating heart of Pakistan’s student tech ecosystem. Organized by the CITE
                (Society of Information Technology &amp; Engineering), the convention unites 800+ builders and competitors from Karachi
                to Khyber in the crisp mountain foothills of Abbottabad.
              </p>
              <p className="mt-3">
                Whether you are training your first machine learning model, competing in algorithmic challenges, or launching a civic startup, you will find
                a category that fits and a judging panel that inspects working solutions —
                not just pitch decks.
              </p>
            </UniversityCard>

            {/* University & Campus Context Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-navy-700/60 bg-navy-800 px-3 py-1 font-mono text-xs text-sand-300 font-bold uppercase">
                <GraduationCap className="h-4 w-4 text-sand-400" />
                3rd National Edition
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-navy-700/60 bg-navy-800 px-3 py-1 font-mono text-xs text-sand-300 font-bold uppercase">
                <MapPin className="h-4 w-4 text-sand-400" />
                Abbottabad, Khyber Pakhtunkhwa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-navy-700/60 bg-navy-800 px-3 py-1 font-mono text-xs text-sand-300 font-bold uppercase">
                <Users className="h-4 w-4 text-sand-400" />
                40+ Participating Universities
              </span>
            </div>

          </div>

          {/* Interactive Readiness Checklist + Sticky Note */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative">
              {/* Washi tape accent on checklist */}
              <WashiTape
                color="sand"
                rotate="2deg"
                width="6rem"
                className="absolute -top-6 left-1/2 z-20 -translate-x-1/2"
              />

              <UniversityCard
                label="READINESS FILE"
                eyebrow="COMPETITOR READINESS"
                sub="CITE'26 · Pre-Event Checklist"
                code="FORM · 01"
                showTab={false}
                className="h-full"
              >
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-navy-700/60">
                  <p className="text-xs text-ivory-muted">
                    Check off each item to prepare for Abbottabad.
                  </p>
                  <span className="shrink-0 rounded-[3px] bg-sand-300/10 border border-sand-400/30 px-2.5 py-1 font-mono text-xs font-bold text-sand-300">
                    {progress}% Complete
                  </span>
                </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-navy-900 border border-navy-700/60">
                <motion.div
                  className="h-full bg-sand-300 rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                />
              </div>

              {/* Checklist items */}
              <ul className="mt-5 space-y-3">
                {checklistItems.map((item, idx) => {
                  const isChecked = checkedItems.includes(idx);
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => toggleCheck(idx)}
                        className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all ${
                          isChecked
                            ? 'bg-navy-800 border border-sand-400/40 text-ivory'
                            : 'bg-navy-900 border border-navy-700/60 text-ivory-muted hover:border-navy-600'
                        }`}
                      >
                        <div
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors ${
                            isChecked
                              ? 'border-sand-400 bg-sand-300 text-navy-950 font-bold'
                              : 'border-navy-600 bg-navy-950'
                          }`}
                        >
                          {isChecked && (
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </motion.span>
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm font-medium leading-relaxed ${isChecked ? 'text-sand-200 font-semibold' : ''}`}>
                          {item}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 pt-4 border-t border-navy-700/60 flex items-center justify-between">
                <span className="text-xs text-ivory-muted">
                  {checkedItems.length === checklistItems.length
                    ? 'You are fully prepared for Abbottabad.'
                    : 'Check items to prepare for the event.'}
                </span>
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-sand-300 hover:text-white uppercase"
                >
                  Register <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
              </UniversityCard>
            </div>

          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4">
          {event.stats.map(({ value, prefix = '', suffix = '', label }) => (
            <div
              key={label}
              className="rounded-xl border border-navy-700/60 bg-navy-850 p-6 text-center shadow-sm"
            >
              <p className="font-display text-3xl font-black text-sand-300">
                {prefix}{value}{suffix}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ivory-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
