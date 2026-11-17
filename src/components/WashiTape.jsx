import { useId } from 'react';

// Realistic washi-tape strip — torn zigzag ends, translucent paper, fibre texture,
// top sheen, bottom shadow, and an organic edge roughening filter.
const tones = {
  sand:  { fill: '#E8D6A8', edge: '#B89052' },
  blue:  { fill: '#A9C8E8', edge: '#5B84AD' },
  green: { fill: '#A8D8B4', edge: '#5E9A6C' },
  pink:  { fill: '#E8B4C8', edge: '#B06C86' },
  clear: { fill: '#E5D6BA', edge: '#B89052' },
};

const TAPE_PATH =
  'M4 2 L116 2 L118 4.5 L115 7 L118 9.5 L115 12 L118 14.5 L115 17 L118 19.5 L115 22 L118 24.5 L115 27 L116 28 L4 28 L2 25.5 L5 23 L2 20.5 L5 18 L2 15.5 L5 13 L2 10.5 L5 8 L2 5.5 L5 3 Z';

export default function WashiTape({
  color = 'sand',
  className = '',
  rotate = '0deg',
  width = '7rem',
}) {
  const uid = useId().replace(/[:]/g, '');
  const fibreId = `washi-fibre-${uid}`;
  const roughId = `washi-rough-${uid}`;
  const t = tones[color] || tones.sand;

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none block ${className}`}
      style={{ width }}
    >
      <span className="block" style={{ transform: `rotate(${rotate})` }}>
        <svg
          viewBox="0 0 120 30"
          className="block h-auto w-full overflow-visible"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.28))' }}
        >
        <defs>
          <pattern
            id={fibreId}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(8)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.24" />
          </pattern>
          <filter id={roughId} x="-8%" y="-20%" width="116%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.18"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g filter={`url(#${roughId})`}>
          {/* Translucent tape body */}
          <path d={TAPE_PATH} fill={t.fill} opacity="0.62" />
          {/* Fibre texture */}
          <path d={TAPE_PATH} fill={`url(#${fibreId})`} />
          {/* Top sheen band */}
          <path d="M5 4 H115 L116 5.6 L115 7.2 H5 L4 5.6 Z" fill="#FFFFFF" opacity="0.2" />
          {/* Soft centre light */}
          <path d="M7 11 H113 V13 H7 Z" fill="#FFFFFF" opacity="0.07" />
          {/* Bottom shadow band */}
          <path d="M4 25 H116 L115 26.6 H5 Z" fill="#000000" opacity="0.1" />
          {/* Paper wrinkles */}
          <path
            d="M9 12 C30 14.5 52 9.5 72 12 S104 13 112 11.5"
            stroke={t.edge}
            strokeWidth="0.45"
            opacity="0.2"
          />
          <path
            d="M10 20 C34 22 56 17.5 78 19.5 S106 21 112 19"
            stroke={t.edge}
            strokeWidth="0.45"
            opacity="0.16"
          />
          {/* Torn edge ink */}
          <path d="M4 2 V28" stroke={t.edge} strokeWidth="0.5" opacity="0.35" />
          <path d="M116 2 V28" stroke={t.edge} strokeWidth="0.5" opacity="0.35" />
          </g>
        </svg>
      </span>
    </span>
  );
}
