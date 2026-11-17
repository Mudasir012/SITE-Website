// Collegiate Pill Badge
const tones = {
  sand: 'bg-sand-400/10 text-sand-300 border-sand-400/30',
  blue: 'bg-navy-500/15 text-navy-300 border-navy-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  outline: 'bg-transparent text-slate-300 border-navy-700',
};

export default function Badge({ tone = 'sand', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
