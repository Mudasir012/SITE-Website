# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** university and college students across Pakistan deciding whether to register for the competition.
- **Secondary:** faculty and university administration checking event details.

## Product Purpose

Official website of CITE 2026, hosted by the CITE society at COMSATS University Islamabad, Abbottabad Campus. It must drive student registrations and present the competition lineup, schedule, and FAQs. Success = registrations submitted.

## Positioning

Pakistan's national-level, on-campus student competition: one full day, ~800 participants, 19 events — not an online or single-city event.

## Operating Context

- Event date December 12, 2026 at CUI Abbottabad Campus; registration via an external form (URL currently a placeholder).
- Static marketing site, no backend; all content lives in `src/data/`.
- Site architecture: 5 dedicated pages — Home, About, Events, Schedule, FAQ — sharing one floating bottom navigation dock and footer.

## Capabilities and Constraints

- React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion + lucide-react (incumbent stack, retained).
- Placeholder material that must be replaced before launch: registration URL, contact email/phone, social links, OG image.
- Owner granted full freedom over content structure, copy, and features in the redesign — nothing from the previous single-page build must survive.

## Brand Commitments

- Host identity: CITE society, COMSATS University Islamabad, Abbottabad Campus. Blue-led identity.
- **Owner-pinned visual constraints (binding):** light theme; solid pastel colors; absolutely no gradients, no glow effects, no blurred blob decorations, no grid/circuit background textures; professional tone.

## Evidence on Hand

- Placeholder copy and data in `src/data/` (events, schedule, and FAQs are plausible but unconfirmed).
- No real photos, logos, testimonials, or press assets yet.

## Product Principles

1. One audience, one job: help a student decide to register and find their event.
2. Credibility is the product: specifics (dates, venues, numbers, named institutions) over hype.
3. Restraint over effects: professional craft, solid color, honest layout — no decorative chrome.
4. One topic per page: depth and findability beat cramming everything into one scroll.

## Accessibility & Inclusion

WCAG AA contrast target, keyboard-navigable UI, semantic HTML, reduced-motion support — carried over as a requirement from the original brief.
