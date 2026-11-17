import { motion } from 'framer-motion';

export default function SegmentedControl({ items, value, onChange, layoutId, label, className = '' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex flex-wrap items-center justify-center rounded-md border border-navy-700/80 bg-navy-850/90 p-1 ${className}`}
    >
      {items.map((item) => {
        const id = typeof item === 'string' ? item : item.value;
        const text = typeof item === 'string' ? item : item.label;
        const count = typeof item === 'string' ? null : item.count;
        const isActive = value === id;

        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            className={`relative rounded px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-300 sm:px-4 sm:text-xs ${
              isActive ? 'text-navy-950' : 'text-sand-200/70 hover:text-sand-100'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutId}-active`}
                aria-hidden="true"
                className="absolute inset-0 rounded bg-sand-300"
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {text}
              {count !== null && <span className="opacity-60">{count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
