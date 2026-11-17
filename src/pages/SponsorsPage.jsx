import { Handshake, FileText, CheckCircle2 } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import Reveal from '../components/Reveal.jsx';
import Button from '../components/Button.jsx';
import { sponsorTiers } from '../data/sponsors.js';
import { event } from '../data/event.js';

const gridByTier = {
  'Title Sponsors': 'mx-auto max-w-3xl gap-4 sm:grid-cols-2',
  'Gold Sponsors': 'mx-auto max-w-4xl gap-4 sm:grid-cols-3',
  'Silver Sponsors': 'mx-auto max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4',
  'Community Partners': 'gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

const sponsorBenefits = [
  'Direct recruitment pipeline: resume book of 800+ top CS/EE graduates',
  'Branded track challenges: bring your company APIs, datasets, and problem statements',
  'Mainstage keynote & workshop spots at CUI Abbottabad Auditorium',
  'On-campus recruitment booth & mentor branding throughout the day',
];

export default function SponsorsPage() {
  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="شراکت داری اور تعاون"
          title="Partners & Sponsors"
          subtitle="Backed by Pakistan's Leading Tech Enterprises & University Chapters"
          description="Our sponsors make it possible to offer free admission, full-day catering, and PKR 600K+ in prizes for students across Pakistan."
        />

        {/* Tiers Grid */}
        <div className="space-y-12 mt-12">
          {sponsorTiers.map(({ tier, note, sponsors }) => (
            <Reveal key={tier}>
              <div className="text-center mb-6">
                <span className="inline-block rounded border border-sand-400/30 bg-sand-300/10 px-3.5 py-1 font-mono text-xs font-bold text-sand-300 uppercase tracking-widest">
                  {tier}
                </span>
                <p className="mt-1 text-xs text-ivory-muted font-medium">{note}</p>
              </div>

              <ul className={`grid ${gridByTier[tier]}`}>
                {sponsors.map((sponsor) => (
                  <li
                    key={sponsor.name}
                    className="academic-card flex min-h-[5.5rem] flex-col items-center justify-center rounded-[6px] border-navy-700 p-5 text-center"
                  >
                    <span className="font-display text-base sm:text-lg font-bold tracking-tight text-ivory">
                      {sponsor.name}
                    </span>
                    {sponsor.tagline && (
                      <span className="mt-1 text-[11px] font-mono text-sand-400/80">{sponsor.tagline}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* Sponsorship Package Info */}
        <div className="academic-panel mt-20 rounded-[8px] p-8 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="font-display text-2xl font-bold uppercase text-ivory">
              Partner with CITE Hackathon 2026
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-ivory-muted">
              Connect your brand with exceptional builders, creators, and engineers from over 40 top universities in Pakistan.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {sponsorBenefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5 rounded-lg border border-navy-700 bg-navy-900 p-3.5 text-xs text-ivory-muted">
                <CheckCircle2 className="h-4 w-4 text-sand-400 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-navy-700 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href={`mailto:${event.contact.email}?subject=CITE%20Hackathon%20Sponsorship%20Inquiry`}
              variant="primary"
              size="md"
            >
              <Handshake className="h-4 w-4" />
              <span>Contact Corporate Team</span>
            </Button>
            <Button
              href={`mailto:${event.contact.email}?subject=Request%20Sponsorship%20Prospectus`}
              variant="secondary"
              size="md"
            >
              <FileText className="h-4 w-4" />
              <span>Download Prospectus PDF</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

