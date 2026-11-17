import { Pin } from 'lucide-react';
import WashiTape from './WashiTape.jsx';

// Realistic Campus Sticky Note — Post-it paper texture, ruled lines, washi tape, fold corner
export default function StickyNote({
  title = 'Student Tip',
  children,
  color = 'sand',   // 'sand' | 'blue' | 'green' | 'pink'
  rotate = '-2deg',
  tape = true,
  tapeAngle = '-1deg',
  className = '',
}) {
  // Paper colour palette — warm, slightly desaturated, like real Post-it stock
  const palette = {
    sand:  { bg: '#F5E6C8', lines: '#D9C49A', text: '#3B2F14', title: '#5B4214' },
    blue:  { bg: '#C8DEF5', lines: '#9DBDE0', text: '#0E2342', title: '#1E4177' },
    green: { bg: '#C8F0D4', lines: '#96D4A8', text: '#0F2D1A', title: '#1A5C30' },
    pink:  { bg: '#F5C8D8', lines: '#E09AB2', text: '#3B0F1E', title: '#8B1F40' },
  };
  const p = palette[color] || palette.sand;

  // Ruled lines repeating every 22px — mimics notebook lines on the note
  const ruledLinesStyle = {
    backgroundImage: `repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 20px,
      ${p.lines} 20px,
      ${p.lines} 21px
    )`,
    backgroundPositionY: '32px',  // start lines below the title area
  };

  return (
    <div
      style={{ transform: `rotate(${rotate})` }}
      className={`relative select-none ${className}`}
    >
      {/* ── Washi tape strip ── */}
      {tape && (
        <WashiTape
          color={color}
          rotate={tapeAngle}
          width="5.5rem"
          className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2"
        />
      )}

      {/* ── Paper body ── */}
      <div
        style={{
          backgroundColor: p.bg,
          ...ruledLinesStyle,
          // Multi-layer shadow: left/bottom offset like a real post-it peeling off
          boxShadow: `
            2px 3px 6px rgba(0,0,0,0.22),
            4px 6px 14px rgba(0,0,0,0.14),
            inset 0 -1px 2px rgba(0,0,0,0.06)
          `,
        }}
        className="relative rounded-[2px] px-4 pb-5 pt-3 overflow-hidden transition-transform duration-200 hover:scale-[1.03] hover:rotate-0"
      >
        {/* Title row */}
        {title && (
          <div
            style={{ color: p.title }}
            className="font-mono text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"
          >
            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
            {title}
          </div>
        )}

        {/* Body text — Caveat handwriting font */}
        <div
          style={{ color: p.text }}
          className="font-handwriting text-[15px] leading-[22px] relative z-10"
        >
          {children}
        </div>

        {/* ── Folded corner ── bottom-right dog-ear */}
        <div
          aria-hidden="true"
          style={{
            borderLeft: `18px solid transparent`,
            borderBottom: `18px solid rgba(0,0,0,0.12)`,
            filter: 'drop-shadow(-1px -1px 1px rgba(0,0,0,0.10))',
          }}
          className="absolute bottom-0 right-0"
        />
        <div
          aria-hidden="true"
          style={{
            borderLeft: `18px solid transparent`,
            borderBottom: `18px solid ${p.bg}`,
            opacity: 0.6,
          }}
          className="absolute bottom-0 right-0"
        />

        {/* Subtle left edge shadow to simulate paper thickness */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 rounded-l"
          style={{ background: `rgba(0,0,0,0.08)` }}
        />
      </div>
    </div>
  );
}
