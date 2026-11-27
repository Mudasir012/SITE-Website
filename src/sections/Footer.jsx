import { Instagram, Mail, MapPin, ArrowUp } from 'lucide-react';
import { event } from '../data/event.js';
import { PAGES } from './Navbar.jsx';

const socialIcons = { Instagram };

export default function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-arcade-ink pb-10 text-arcade-bone">
      <div className="wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Department */}
        <div className="sm:col-span-2 lg:col-span-1">
          <button
            type="button"
            onClick={() => onNavigate('home', '/')}
            aria-label="CITE 2026 — home"
            className="group flex shrink-0 items-center text-left"
          >
            <img
              src="/CITE_New_Logo_White.png"
              alt="CITE 2026"
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </button>

          <p className="mt-4 text-xs leading-relaxed text-arcade-mute">
            Official annual national tech competition hosted by the <strong>Department of Computer Science</strong> at COMSATS University Islamabad, Abbottabad Campus.
          </p>

          <div className="mt-6 flex gap-2" aria-label="Social media channels">
            {event.socials.map(({ label, href, icon }) => {
              const Icon = socialIcons[icon];
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center rounded border border-white/10 bg-arcade-coal text-arcade-bone/70 transition-colors hover:bg-arcade-lime hover:text-arcade-ink"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Dedicated Pages Navigation */}
        <div>
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-lime">
            Dedicated Pages
          </h3>
          <ul className="mt-4 space-y-2 font-display text-xs">
            {PAGES.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(page.id, page.path)}
                  className="text-arcade-mute transition-colors hover:text-arcade-lime uppercase"
                >
                  {page.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Event Schedule & Campus */}
        <div>
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-lime">
            Event & Campus
          </h3>
          <ul className="mt-4 space-y-2.5 font-display text-xs text-arcade-mute">
            <li className="font-semibold text-arcade-bone">{event.dateLabel}</li>
            <li>{event.venue}</li>
            <li>{event.city}</li>
            <li className="pt-2">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-arcade-lime transition-colors hover:text-white"
              >
                Register as an Ambassador →
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('ambassador', '/ambassador')}
                className="font-bold text-arcade-lime transition-colors hover:text-white"
              >
                Ambassador Portal →
              </button>
            </li>
          </ul>
        </div>

        {/* Contact & Inquiries */}
        <div>
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-arcade-lime">
            Campus Helpdesk
          </h3>
          <ul className="mt-4 space-y-3 font-display text-xs text-arcade-mute">
            <li>
              <a
                href={`mailto:${event.contact.email}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-arcade-lime" aria-hidden="true" />
                <span>{event.contact.email}</span>
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-arcade-lime" aria-hidden="true" />
              <span>{event.contact.address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="border-t border-white/10 py-6 font-display text-xs text-arcade-mute">
        <div className="wrap flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>COMSATS Innovations And Tech Expo 2026 COMSATS University Islamabad, Abbottabad Campus.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 font-bold uppercase tracking-[0.16em] text-arcade-lime transition-colors hover:text-white"
          >
            Back to Top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
