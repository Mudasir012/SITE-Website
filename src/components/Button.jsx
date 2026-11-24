// Collegiate Button Component — Solid, tactile, dignified
const base =
  'button-shell group inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:opacity-50 disabled:pointer-events-none select-none text-xs sm:text-sm rounded-md';

const variants = {
  primary:
    'bg-sand-300 hover:bg-sand-200 text-navy-950 shadow-sm active:translate-y-0.5',
  secondary:
    'bg-navy-800 hover:bg-navy-750 text-sand-200 hover:text-sand-100 border border-navy-700 hover:border-navy-600 shadow-sm active:translate-y-0.5',
  blue:
    'bg-navy-500 hover:bg-navy-400 text-white shadow-sm active:translate-y-0.5',
  ghost:
    'bg-transparent hover:bg-navy-800 text-sand-300 hover:text-sand-100',
  dark:
    'bg-navy-950 hover:bg-navy-900 text-sand-200 border border-navy-700/60',
  cite:
    'bg-cite-yellow hover:bg-white text-cite-darker shadow-sm active:translate-y-0.5',
  citeOutline:
    'border border-white/60 bg-transparent text-white hover:bg-white hover:text-black shadow-sm',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-xs sm:text-sm',
  lg: 'px-8 py-3.5 text-xs sm:text-sm',
};

export default function Button({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls} {...props}>
        <span className="inline-flex items-center justify-center gap-2">{children}</span>
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} {...props}>
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
