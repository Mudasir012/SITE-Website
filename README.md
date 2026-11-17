# CITE Hackathon 2026 — Official Website

An eight-page collegiate site for CITE Hackathon 2026 at COMSATS University Islamabad, Abbottabad Campus. Built with React 18, Vite 5, Tailwind CSS 3, Framer Motion, and lucide-react.

## Quick start

```bash
npm install
npm run dev
npm run build
npm run preview
```

Requires Node.js 18+.

## Architecture

- Hash-routed pages: Home, About, Tracks, Prizes, Schedule, Judges & Mentors, Sponsors, FAQ.
- `src/App.jsx` owns hash routing, page transitions, and route-level lazy loading.
- `src/sections/Dock.jsx` and `src/sections/Footer.jsx` are the only shared sections.
- `src/pages/` contains one file per route; `src/components/` contains reusable primitives and motion wrappers.
- All editable content lives in `src/data/`.

## Content

| File | Controls |
|---|---|
| `src/data/event.js` | Event identity, date, venue, registration URL, contact, socials, stats, university facts |
| `src/data/tracks.js` | Competition tracks |
| `src/data/prizes.js` | Podium and special awards |
| `src/data/schedule.js` | One-day agenda and session types |
| `src/data/people.js` | Judge and mentor profiles |
| `src/data/sponsors.js` | Sponsor tiers and partner names |
| `src/data/faqs.js` | FAQ questions and answers |
| `index.html` | Title, meta/OG tags, fonts, JSON-LD |

The registration URL and the judge/sponsor profiles are still placeholders and are intentionally presented as-is until real data is supplied.

## Theme

Colors are defined in `tailwind.config.js` as `navy`, `sand`, and `ivory` scales. A small set of global CSS custom properties in `src/styles/index.css` covers the canvas, focus ring, selection, and scrollbar. Paper/sticky-note palettes live in their components because they are material-specific.

Fonts: Space Grotesk for display, Inter for UI text, Playfair Display for editorial subtitles, Noto Nastaliq Urdu for the motto, Caveat for handwritten notes, and JetBrains Mono for data labels.

## Motion

Motion is authored in Framer Motion: hero clip reveal, page transitions, a spring dock indicator, shared-element filter/track selection, countdown digit rolls, checklist feedback, and restrained scroll reveals. Every animated component has a `prefers-reduced-motion` branch. CSS only animates the sponsor marquee and suppresses it under reduced motion.

## Before launch

- Replace the registration URL in `src/data/event.js`.
- Replace placeholder judges, mentors, sponsors, contact details, and social links.
- Export a real 1200×630 PNG/JPG for `og:image`.
- Verify all dates and prize amounts against the confirmed event brief.

## Accessibility

Semantic landmarks, one `h1` per page, labelled navigation/filter groups, visible focus rings, keyboard-operable controls, AA-target contrast, reduced-motion support, and explicit image dimensions.
