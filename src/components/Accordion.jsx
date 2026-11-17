import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Accordion({ items, idPrefix = 'accordion' }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'border-sand-400/80 bg-navy-800'
                : 'border-navy-700 bg-navy-850 hover:border-navy-600'
            }`}
          >
            <h3>
              <button
                type="button"
                id={`${idPrefix}-btn-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ivory transition-colors hover:text-sand-300 sm:px-6 sm:py-5"
              >
                <span className="text-sm sm:text-base">{item.q}</span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-sand-300 text-navy-950 font-bold' : 'bg-navy-750 text-sand-400'
                  }`}
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${idPrefix}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${idPrefix}-btn-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-ivory-muted sm:px-6 border-t border-navy-700/60 pt-3">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
