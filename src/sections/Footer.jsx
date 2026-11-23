import { Facebook, Github, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Terminal, ArrowUp } from 'lucide-react';
import { event } from '../data/event.js';
import { PAGES } from './Dock.jsx';

const socialIcons = { Facebook, Instagram, Linkedin, Twitter, Github };

export default function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-navy-700 bg-navy-950 pb-28 text-ivory lg:pb-20">
      {/* Upper collegiate footer */}
      <div className="wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Department */}
        <div className="sm:col-span-2 lg:col-span-1">
          <button
            type="button"
            onClick={() => onNavigate('home', '#/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="grid h-10 w-10 place-items-center rounded bg-sand-300 text-navy-950 font-bold">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-ivory">
                CITE<span className="text-sand-400">&apos;26</span>
              </span>
              <span className="ml-1.5 rounded bg-navy-850 px-1.5 py-0.5 font-mono text-[11px] font-bold text-sand-300 border border-navy-700">
                {event.edition}
              </span>
            </div>
          </button>

          <p className="mt-4 text-xs leading-relaxed text-ivory-muted">
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
                  className="grid h-8 w-8 place-items-center rounded bg-navy-850 border border-navy-700 text-sand-300 hover:bg-sand-300 hover:text-navy-950 transition-colors"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Dedicated Pages Navigation */}
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">
            Dedicated Pages
          </h3>
          <ul className="mt-4 space-y-2 text-xs font-mono">
            {PAGES.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(page.id, page.path)}
                  className="text-ivory-muted hover:text-sand-300 transition-colors uppercase"
                >
                  {page.label}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => onNavigate('admin', '#/admin')}
                className="text-sand-400/80 hover:text-sand-300 transition-colors uppercase font-bold flex items-center gap-1"
              >
                <span>Admin Portal</span>
                <span className="text-[9px] bg-sand-400/20 px-1 py-0.2 rounded font-sans">Staff</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Event Schedule & Campus */}
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">
            Event & Campus
          </h3>
          <ul className="mt-4 space-y-2.5 text-xs text-ivory-muted">
            <li className="font-semibold text-ivory">{event.dateLabel}</li>
            <li>{event.venue}</li>
            <li>{event.city}</li>
            <li className="pt-2">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sand-300 hover:text-white transition-colors"
              >
                Register Online →
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Inquiries */}
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">
            Campus Helpdesk
          </h3>
          <ul className="mt-4 space-y-3 text-xs text-ivory-muted">
            <li>
              <a
                href={`mailto:${event.contact.email}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-sand-400 shrink-0" />
                <span>{event.contact.email}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${event.contact.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-sand-400 shrink-0" />
                <span>{event.contact.phone}</span>
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-sand-400 shrink-0 mt-0.5" />
              <span>{event.contact.address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="border-t border-navy-750 py-6 text-xs text-ivory-subtle font-mono">
        <div className="wrap flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {year} CITE Society, COMSATS University Islamabad, Abbottabad Campus.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 font-bold text-sand-300 hover:text-white transition-colors uppercase tracking-wider"
          >
            Back to Top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
