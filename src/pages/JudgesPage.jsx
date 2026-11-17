import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import FacultyIdCard from '../components/FacultyIdCard.jsx';
import { people } from '../data/people.js';
import { event } from '../data/event.js';

export default function JudgesPage() {
  const [filter, setFilter] = useState('All');
  const reduced = useReducedMotion();

  const filteredPeople = people.filter((person) => {
    if (filter === 'All') return true;
    return person.tag === filter;
  });

  const filters = [
    { value: 'All', label: 'All Lineup', count: people.length },
    { value: 'Judge', label: 'Grand Judging Panel' },
    { value: 'Mentor', label: 'On-Site Tech Mentors' },
  ];

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="رہنمائی اور رہبری — معمارانِ قوم"
          title="Judges & Mentors"
          subtitle="Distinguished Faculty & Tech Leaders from Top Organizations"
          description="Senior software architects, professors, and founders from Pakistan’s leading tech organizations — on campus for the full day to review code, unblock architectures, and recruit talent."
        />

        <div className="my-10 flex justify-center">
          <SegmentedControl
            items={filters}
            value={filter}
            onChange={setFilter}
            layoutId="judges-filter"
            label="Filter judges and mentors"
          />
        </div>

        <motion.div layout className="grid justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredPeople.map((person) => (
              <motion.div
                key={person.name}
                layout
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduced ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[300px]"
              >
                <FacultyIdCard person={person} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="academic-panel mx-auto mt-16 max-w-2xl rounded-[8px] p-8 text-center">
          <h4 className="font-display text-lg font-bold text-ivory">
            Interested in Mentoring or Judging?
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-ivory-muted">
            We welcome seasoned engineers, researchers, and tech executives to give back to Pakistan’s brightest students.
          </p>
          <div className="mt-4">
            <a
              href={`mailto:${event.contact.email}?subject=Mentorship%20Application%20CITE%202026`}
              className="button-shell group inline-flex items-center gap-2 rounded bg-sand-300 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-navy-950 transition-colors hover:bg-sand-200"
            >
              <span className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Apply to Mentor
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
