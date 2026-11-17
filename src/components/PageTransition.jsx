import { motion, useReducedMotion } from 'framer-motion';

export default function PageTransition({ children }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={
        reduced
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 0, clipPath: 'inset(0 0 0 0)', transition: { duration: 0.16, ease: 'easeIn' } }
      }
      transition={{ duration: reduced ? 0.16 : 0.44, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
