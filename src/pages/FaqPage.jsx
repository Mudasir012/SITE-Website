import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import Accordion from '../components/Accordion.jsx';
import { faqs } from '../data/faqs.js';
import { event } from '../data/event.js';

const faqCategories = [
  { label: 'All Questions', filter: null },
  { label: 'Eligibility & Teams', indices: [0, 1] },
  { label: 'Preparation & Rules', indices: [2, 3, 4] },
];

export default function FaqPage() {
  const [selectedCat, setSelectedCat] = useState(0);
  const reduced = useReducedMotion();

  const activeCategory = faqCategories[selectedCat];
  const displayedFaqs = activeCategory.indices
    ? faqs.filter((_, idx) => activeCategory.indices.includes(idx))
    : faqs;

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="سوالات و جوابات — معلوماتِ عامہ"
          title="Frequently Asked Questions"
          subtitle="Everything You Need to Know Before Registration"
          description="Clear details on eligibility, teams, what to bring, competition rules, and project evaluation."
        />

        <div className="my-10 flex justify-center">
          <SegmentedControl
            items={faqCategories.map((cat, idx) => ({ value: idx, label: cat.label }))}
            value={selectedCat}
            onChange={setSelectedCat}
            layoutId="faq-filter"
            label="Filter frequently asked questions"
          />
        </div>

        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedCat}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: -12, transition: { duration: 0.14 } }}
              transition={{ duration: reduced ? 0.14 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Accordion items={displayedFaqs} idPrefix={`faq-page-${selectedCat}`} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="academic-panel mx-auto mt-16 max-w-2xl rounded-[8px] p-6 text-center sm:p-8">
          <h4 className="font-display text-lg font-bold text-ivory">
            Still Have Inquiries?
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-ivory-muted">
            The student committee of CITE Society is available to answer questions about registration, teams, and the competition.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-sand-300">
            <a
              href={`mailto:${event.contact.email}`}
              className="flex items-center gap-2 rounded border border-navy-700 bg-navy-900 px-4 py-2 transition-colors hover:border-sand-400"
            >
              <Mail className="h-4 w-4 text-sand-400" />
              <span>{event.contact.email}</span>
            </a>
            <a
              href={`tel:${event.contact.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 rounded border border-navy-700 bg-navy-900 px-4 py-2 transition-colors hover:border-sand-400"
            >
              <Phone className="h-4 w-4 text-sand-400" />
              <span>{event.contact.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
