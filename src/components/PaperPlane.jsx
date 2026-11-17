import { motion, useReducedMotion } from 'framer-motion';

// Crisp paper-plane icon — clean folded silhouette with a soft dashed trail
export default function PaperPlane({ className = '', flightTrail = true, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7', md: 'w-10 h-10', lg: 'w-14 h-14' };
  const sizePx = { sm: 28, md: 40, lg: 56 }[size] ?? 40;
  const sz = sizes[size] || sizes.md;
  const scale = sizePx / 48;
  const reduced = useReducedMotion();

  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      {/* ── Clean dashed flight trail ── */}
      {flightTrail && (
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            left: -111 * scale,
            top: 15 * scale,
            width: 118 * scale,
            height: 64 * scale,
          }}
          viewBox="0 0 118 64"
          fill="none"
        >
          <path
            d="M4 58 C26 50 44 24 66 16 S100 8 114 5"
            stroke="#E5D6BA"
            strokeWidth={1.4 * scale}
            strokeDasharray={`${3 * scale} ${6 * scale}`}
            strokeLinecap="round"
            opacity="0.38"
          />
        </svg>
      )}

      {/* ── Animated plane ── */}
      <motion.div
        className="relative z-10"
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: -18, y: 12, rotate: -8 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          className={`${sz} drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lower wing (shaded) */}
          <path d="M45 3 L19.5 25.5 L26 44 Z" fill="#C9A85C" />
          {/* Upper wing (lit) */}
          <path d="M45 3 L3 20 L19.5 25.5 Z" fill="#F2E6D0" />
          {/* Fold crease from nose to notch */}
          <path d="M19.5 25.5 L45 3" stroke="#947038" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          {/* Outer fold edge */}
          <path d="M3 20 L19.5 25.5 L26 44" stroke="#B89052" strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />
        </svg>
      </motion.div>
    </div>
  );
}
