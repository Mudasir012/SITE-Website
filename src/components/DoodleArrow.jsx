// Hand-drawn curly doodle arrow pointing to actions
export default function DoodleArrow({ text = 'Free food & parking!', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 font-serif italic text-sand-300 text-xs sm:text-sm select-none ${className}`}>
      <span>{text}</span>
      <svg
        className="w-10 h-7 text-sand-400 rotate-12"
        viewBox="0 0 45 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5,22 C18,28 30,12 38,8" />
        <path d="M30,5 L38,8 L36,16" />
      </svg>
    </div>
  );
}

