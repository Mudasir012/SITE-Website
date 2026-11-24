# CITE Hackathon 2026 — Official Website

A five-page collegiate site for CITE 2026 at COMSATS University Islamabad, Abbottabad Campus. Built with React 18, Vite 5, Tailwind CSS 3, Framer Motion, and lucide-react.

## Quick start

```bash
npm install
npm run dev
npm run build
npm run preview
```

Requires Node.js 18+.

## Architecture

- Hash-routed pages: Home, About, Events, Schedule, FAQ.
- `src/App.jsx` owns hash routing, page transitions, and route-level lazy loading.
- `src/sections/Navbar.jsx` and `src/sections/Footer.jsx` are the only shared sections.
- `src/pages/` contains one file per route; `src/components/` contains reusable primitives and motion wrappers.
- All editable content lives in `src/data/`.

## Content

| File | Controls |
|---|---|
| `src/data/event.js` | Event identity, date, venue, registration URL, contact, socials, stats, university facts |
| `src/data/tracks.js` | Competition event lineup |
| `src/data/schedule.js` | One-day agenda and session types |
| `src/data/faqs.js` | FAQ questions and answers |
| `index.html` | Title, meta/OG tags, fonts, JSON-LD |

The registration URL and contact details are still placeholders and are intentionally presented as-is until real data is supplied.

## Theme

Colors are defined in `tailwind.config.js` as `navy`, `sand`, `ivory`, and `cite` scales; `cite` holds the blue/yellow/green/red sampled from the CITE emblem. A small set of global CSS custom properties in `src/styles/index.css` covers the canvas, focus ring, selection, and scrollbar. Paper/sticky-note palettes live in their components because they are material-specific.

Fonts: Space Grotesk is the single voice for the hero, navbar, buttons, and headings. Inter, Playfair Display, Caveat, and JetBrains Mono remain only where an existing interior component needs them (body copy, handwritten notes, data labels). No Urdu font is loaded.

The hero video is a placeholder at `public/hero-campus.mp4` with `public/hero-poster.jpg` as its poster; replace both with the final CITE reel before launch.

## Motion

Motion is authored in Framer Motion: hero staggered reveal, page transitions, filter selection, countdown digit rolls, checklist feedback, and restrained scroll reveals. Every animated component has a `prefers-reduced-motion` branch; the hero video also stays paused for reduced-motion users.

## Before launch

- Replace the registration URL in `src/data/event.js`.
- Replace placeholder contact details and social links.
- Export a real 1200×630 PNG/JPG for `og:image`.
- Verify all dates against the confirmed event brief.

## Accessibility

Semantic landmarks, one `h1` per page, labelled navigation/filter groups, visible focus rings, keyboard-operable controls, AA-target contrast, reduced-motion support, and explicit image dimensions.
