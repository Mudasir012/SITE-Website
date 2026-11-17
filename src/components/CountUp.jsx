import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

// Animated number that counts up the first time it scrolls into view.
export default function CountUp({ end, prefix = '', suffix = '', duration = 2, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(end.toLocaleString('en-US'));
      return;
    }
    const controls = animate(0, end, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('en-US')),
    });
    return () => controls.stop();
  }, [inView, end, duration, reduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
