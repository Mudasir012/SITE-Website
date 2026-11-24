import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { event } from '../data/event.js';

export const PAGES = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'tracks', label: 'Events', path: '/tracks' },
  { id: 'schedule', label: 'Schedule', path: '/schedule' },
  { id: 'faq', label: 'FAQ', path: '/faq' },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime focus-visible:ring-offset-2 focus-visible:ring-offset-black';

export default function Navbar({ activePage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (pageId, path) => {
    setMenuOpen(false);
    onNavigate(pageId, path);
  };

  return (
    <header className="sticky top-0 z-50 bg-black font-display">
      <nav aria-label="Primary" className="wrap flex h-14 items-center justify-between gap-6 sm:gap-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate('home', '/')}
          className={`group flex shrink-0 items-center ${focusRing}`}
          aria-label="CITE 2026 — home"
        >
          <img
            src="/CITE_White_Icon_Only.png"
            alt=""
            width="44"
            height="44"
            className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11"
          />
        </button>

        {/* Desktop links */}
        <ul className="mx-auto hidden items-center gap-2 lg:flex xl:gap-3">
          {PAGES.map((page) => {
            const isActive = activePage === page.id;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => navigate(page.id, page.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`border-b-2 px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ${focusRing} ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  {page.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-md bg-arcade-lime px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-arcade-ink transition-colors hover:bg-white ${focusRing}`}
          >
            <span className="hidden sm:inline">Register now</span>
            <span className="sm:hidden">Register</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className={`grid h-9 w-9 place-items-center rounded-md text-white transition-colors hover:bg-white/10 lg:hidden ${focusRing}`}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-navigation" className="border-t border-white/15 bg-arcade-coal lg:hidden">
          <ul className="wrap flex flex-col py-2">
            {PAGES.map((page) => {
              const isActive = activePage === page.id;
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => navigate(page.id, page.path)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center justify-between border-b border-white/10 px-2 py-3 text-left text-sm font-semibold transition-colors ${
                      isActive ? 'text-white' : 'text-white/70 hover:text-white'
                    } ${focusRing}`}
                  >
                    {page.label}
                    {isActive && <span aria-hidden="true" className="h-0.5 w-6 bg-white" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
