# Design System — CITE Hackathon 2026 (After-Dark Campus Arcade)

## Visual World

- **Inspiration:** MDNT Events' black-stage energy, filtered through a student competition campus at night. The product behaves like a campus arcade: clear wayfinding, big type, physical ticket and route metaphors, and a few deliberate 3D folds.
- **Core aesthetic:** Near-black solid grounds, bone-white type, electric violet and acid lime accents. Crisp edges, hard rules, tabular data, and compact labels. No gradients, glows, blurred blobs, grid/circuit textures, or decorative moving strips.
- **Scope:** Five dedicated pages — Home, About, Events, Schedule, FAQ — under one compact black navbar and footer. Each page shares the palette and motion grammar but owns a distinct composition. The hero video exists only on Home.

## Color Tokens

| Token | Hex | Role |
| --- | --- | --- |
| `arcade.ink` | `#050505` | Primary ground, darkest stage |
| `arcade.coal` | `#121212` | Raised panels and alternating sections |
| `arcade.bone` | `#FFFFFF` | Primary type |
| `arcade.mute` | `#A3A3A3` | Supporting copy |
| `arcade.violet` | `#8A2BE2` | About / CS-lane accent |
| `arcade.lime` | `#BFFF00` | Primary action and highlight |
| `arcade.limeHot` | `#7BFF00` | Fun & esports lane accent |

Legacy navy, sand, ivory and `cite.*` tokens remain in `tailwind.config.js` for untouched admin surfaces; public marketing pages use `arcade.*`.

## Typography

- **Single public voice:** Space Grotesk for all public-page display, body, buttons, labels, and data. This is owner-pinned; keep it even though it is a common face.
- Display: bold, uppercase, tracking around `-0.045em`, clamp-based sizes capped near `8rem`.
- Body: compact `sm` to `base`, generous leading, muted gray only for secondary text.
- Numerals: `tabular-nums` for countdowns, indexes, counts, and prize/detail labels.
- No Urdu/Nastaliq type. JetBrains Mono is retained only for legacy admin/data surfaces, not the public redesign.

## Page Identities

1. **Home** — full-bleed campus video under a heavy black overlay, treated as an event poster: oversized `CITE'26`, a vertical `12.12.26` stack, and a hard four-cell fact rail with the lime register action. The day route, folded event tiles, and folded student pass live below; the pass appears only at the final register section. Lime leads.
2. **About** — violet-led editorial dossier. No hero media and no Home-style folded pass. A right-hand dossier rail, numbered facts, an interactive readiness checklist, and quiet row-based fact cards.
3. **Events** — competition index board. Typographic hero with lane counts, two category sections, and numbered entry-ticket cards. Category A uses violet; Category B uses limeHot. Cards carry event name, category, prize pool (`To be announced`), format (`On-site judging`), eligibility, and register action. No prize amount is claimed.
4. **Schedule** — scroll-driven time shaft. A sticky live-time HUD tracks the session in view while cards rise out of depth along a single vertical spine; type filters stay functional. Lime for competition moments, violet for ceremony/judging.
5. **FAQ** — categorized accordion with direct answers.

## Components

- **Navbar:** compact solid black bar, white logo chip, wordmark, plain white active underline, quiet admin link, lime Register action. Mobile collapses into a solid panel.
- **EventCard:** numbered entry ticket with a vertical code rail, clipped image window, accent strip, metadata `<dl>`, and a keyboard-focusable register action. The action arrow inverts to lime on hover/focus.
- **ScrollReveal:** shared `Reveal` and `RevealHeading` wrappers using Framer Motion `useInView`, with a reduced-motion path that renders content without spatial movement.
- **Footer:** black shell, Space Grotesk, lime accents, same route map as the navbar.

## Motion Grammar

- Motion explains hierarchy and state; it is not decoration. No loops, marquees, or moving strips.
- **Home:** hero parallax, poster-like staged copy entrance, scroll-linked route rail, word-mask heading reveals, clipped image reveals, and a 3D folded pass reserved for the closing CTA.
- **About:** dossier-list entrance, violet word reveals, checklist progress spring, and editorial row reveals.
- **Events:** one authored "bracket drop" — cards enter with a capped stagger, a slight 3D fold, a left-to-right image clip wipe, and a bottom rule that draws in. Hover/focus scale the image inside its clipped frame and invert the action arrow.
- **Schedule:** one parent scroll progress value drives every row's depth state; the row nearest viewport centre becomes the live HUD entry. Hover draws a short accent rule at the card base.
- Timing: `0.3–0.8s`, ease `[0.16, 1, 0.3, 1]`; cap sibling delay around `0.35s`.
- Every animation has a reduced-motion alternative that keeps state changes legible without travel.

## Browser Surfaces

- Selection: lime on ink. Caret: lime. Focus rings: bone/lime or violet on the relevant page. Scrollbar: black track, charcoal thumb, lime on hover.
- Keep contrast at WCAG AA: white on ink/coal, muted gray on dark only for secondary copy, violet used on dark with white foreground where needed.

## Non-Negotiables

- Preserve event facts, routes, and `event.registrationUrl`.
- Register now remains the primary action on every public page.
- No hero media outside Home.
- No gradients, glows, blurred blobs, grid/circuit textures, moving strips, Urdu, or mixed display fonts.
