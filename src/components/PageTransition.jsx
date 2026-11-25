import { motion, useReducedMotion } from 'framer-motion';

export default function PageTransition({ children }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0.08 : 0.12, ease: 'easeIn' } }}
      transition={{ duration: reduced ? 0.1 : 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
