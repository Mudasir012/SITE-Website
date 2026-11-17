import { motion, useReducedMotion } from 'framer-motion';

// Fade-up-on-scroll wrapper. Animates once per element; renders statically
// when the user prefers reduced motion.
export default function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
