# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (equal weight):** university and college students across Pakistan deciding whether to register for the hackathon.
- **Primary (equal weight):** prospective sponsors evaluating whether the event is credible and worth funding.
- **Secondary:** judges and mentors checking legitimacy before committing; faculty and university administration.

## Product Purpose

Official website of CITE Hackathon 2026, hosted by the CITE society at COMSATS University Islamabad, Abbottabad Campus. It must drive student registrations and sponsor inquiries, and present tracks, prizes, schedule, judges/mentors, sponsors, and FAQs. Success = registrations submitted and sponsorship conversations started.

## Positioning

Pakistan's national-level, on-campus student hackathon: one full day, ~800 participants, real industry judges and mentors, cash prizes plus incubation at CUI Abbottabad — not an online or single-city event.

## Operating Context

- Event date December 18, 2026 at CUI Abbottabad Campus; registration via an external form (URL currently a placeholder).
- Static marketing site, no backend; all content lives in `src/data/`.
- Site architecture confirmed with the owner: 8 dedicated pages — Home, About, Tracks, Prizes, Schedule, Judges & Mentors, Sponsors, FAQ — sharing one floating bottom navigation dock and footer.

## Capabilities and Constraints

- React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion + lucide-react (incumbent stack, retained).
- Placeholder material that must be replaced before launch: registration URL, contact email/phone, judge/mentor names and photos, sponsor names/logos, social links, OG image.
- Owner granted full freedom over content structure, copy, and features in the redesign — nothing from the previous single-page build must survive.

## Brand Commitments

- Host identity: CITE society, COMSATS University Islamabad, Abbottabad Campus. Blue-led identity.
- **Owner-pinned visual constraints (binding):** light theme; solid pastel colors; absolutely no gradients, no glow effects, no blurred blob decorations, no grid/circuit background textures; professional tone.

## Evidence on Hand

- Realistic placeholder copy and data in `src/data/` (tracks, prizes, schedule, FAQs are plausible but unconfirmed; judges/mentors/sponsors are invented placeholders and must not be presented as confirmed partnerships).
- No real photos, logos, testimonials, or press assets yet.

## Product Principles

1. Two audiences, one site: every page must serve both a student deciding to register and a sponsor deciding to fund.
2. Credibility is the product: specifics (dates, venues, numbers, named institutions) over hype.
3. Restraint over effects: professional craft, solid color, honest layout — no decorative chrome.
4. One topic per page: depth and findability beat cramming everything into one scroll.

## Accessibility & Inclusion

WCAG AA contrast target, keyboard-navigable UI, semantic HTML, reduced-motion support — carried over as a requirement from the original brief.
