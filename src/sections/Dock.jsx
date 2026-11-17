import { motion, MotionConfig } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  CircleHelp,
  Handshake,
  House,
  Info,
  Layers,
  Trophy,
  Users,
} from 'lucide-react';
import { event } from '../data/event.js';

export const PAGES = [
  { id: 'home', label: 'Home', path: '#/', icon: House },
  { id: 'about', label: 'About', path: '#/about', icon: Info },
  { id: 'tracks', label: 'Tracks', path: '#/tracks', icon: Layers },
  { id: 'prizes', label: 'Prizes', path: '#/prizes', icon: Trophy },
  { id: 'schedule', label: 'Schedule', path: '#/schedule', icon: CalendarDays },
  { id: 'judges', label: 'Mentors', path: '#/judges', icon: Users },
  { id: 'sponsors', label: 'Sponsors', path: '#/sponsors', icon: Handshake },
  { id: 'faq', label: 'FAQ', path: '#/faq', icon: CircleHelp },
];

const bubbleSpring = { type: 'spring', stiffness: 480, damping: 34, mass: 0.85 };

export default function Dock({ activePage, setActivePage }) {
  const activeIndex = Math.max(0, PAGES.findIndex((page) => page.id === activePage));

  const handleNavClick = (pageId, path) => {
    setActivePage(pageId);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <MotionConfig reducedMotion="user">
        <nav
          aria-label="Primary"
          className="pointer-events-auto relative flex max-w-full items-center gap-1.5 rounded-2xl border border-navy-700/80 bg-navy-950 p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.85)]"
        >
          <span aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-sand-400/20" />
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-5 top-0 h-px origin-left bg-sand-300"
            initial={false}
            animate={{ scaleX: (activeIndex + 1) / PAGES.length }}
            transition={bubbleSpring}
          />

          <ul className="flex items-center gap-0.5 sm:gap-1">
            {PAGES.map((page) => {
              const isActive = activePage === page.id;
              const Icon = page.icon;
              return (
                <li key={page.id} className="flex">
                  <motion.button
                    layout
                    type="button"
                    onClick={() => handleNavClick(page.id, page.path)}
                    aria-label={page.label}
                    aria-current={isActive ? 'page' : undefined}
                    whileTap={{ scale: 0.94 }}
                    transition={bubbleSpring}
                    className={`group relative flex h-10 items-center justify-center overflow-hidden rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                      isActive
                        ? 'gap-1.5 px-3 text-navy-950 max-[359px]:px-2'
                        : 'w-8 text-sand-300/75 hover:bg-navy-800/80 hover:text-sand-100 max-[359px]:w-7 sm:w-9 md:w-auto md:gap-1.5 md:px-2.5 md:text-sand-300/75 md:hover:text-sand-100'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="dock-active-bubble"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-sand-300 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.7)]"
                        transition={bubbleSpring}
                      />
                    )}

                    <Icon
                      className={`relative z-10 h-[17px] w-[17px] shrink-0 transition-transform duration-200 ${
                        isActive ? '' : 'group-hover:-rotate-6 group-hover:scale-110'
                      }`}
                      strokeWidth={isActive ? 2.1 : 1.9}
                      aria-hidden="true"
                    />

                    {isActive ? (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 whitespace-nowrap"
                      >
                        {page.label}
                      </motion.span>
                    ) : (
                      <span className="relative z-10 hidden whitespace-nowrap md:inline">
                        {page.label}
                      </span>
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ul>

          <span aria-hidden="true" className="hidden h-7 w-px bg-navy-700/80 lg:block" />

          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-shell group hidden h-10 items-center gap-1.5 rounded-xl bg-sand-300 px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-navy-950 transition-colors hover:bg-sand-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 lg:inline-flex"
          >
            <span className="inline-flex items-center gap-1.5">
              Register
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </a>
        </nav>
      </MotionConfig>
    </div>
  );
}
