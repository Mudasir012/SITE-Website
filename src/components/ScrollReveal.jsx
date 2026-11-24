import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export function Reveal({ children, className = '', delay = 0, y = 24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealHeading({ lines, className = '', style, as: Tag = 'h2' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const label = lines.map((line) => line.text).join(' ');

  return (
    <Tag ref={ref} aria-label={label} data-revealed={inView ? 'true' : 'false'} className={className} style={style}>
      {lines.map((line, lineIndex) => (
        <span key={`${line.text}-${lineIndex}`} aria-hidden="true" className="block">
          {line.text.split(' ').map((word, wordIndex, words) => (
            <span key={`${word}-${wordIndex}`} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className={`inline-block ${
                  line.tone === 'violet'
                    ? 'text-arcade-violet'
                    : line.accent
                      ? 'text-arcade-lime'
                      : ''
                }`}
                style={{ marginRight: wordIndex === words.length - 1 ? 0 : '0.22em' }}
                initial={reduced ? false : { y: 40, opacity: 0 }}
                animate={
                  reduced
                    ? undefined
                    : inView
                      ? { y: 0, opacity: 1 }
                      : { y: 40, opacity: 0 }
                }
                transition={{
                  duration: 0.72,
                  delay: lineIndex * 0.1 + wordIndex * 0.055,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
