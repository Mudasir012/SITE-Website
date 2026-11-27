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

## Registration database setup

The event detail page opens an on-site registration form (name, email, CNIC,
phone, and an optional campus ambassador). Registrations are written to Supabase
and appear in the admin portal under **Registrations**. Public registration is
**closed by default** and is switched on by an admin in
**Admin Portal → Event Page Tracks → Public Registration (Site-Wide)**. Until
then, event pages show a disabled “Registration not open” button and the database
rejects submissions.

Run these files once in the Supabase SQL Editor, in this order:

1. `supabase/registration-form.sql` — adds the `cnic`, `event_slug`, and
   `event_name` columns and creates two validated `SECURITY DEFINER` functions:
   - `list_public_ambassadors()` — public-safe list of approved ambassadors.
   - `register_for_event(...)` — validates and inserts one pending registration.
2. `supabase/registration-toggle.sql` — adds the `site_settings` table,
   `get_public_settings()` for the public button state, and a trigger that blocks
   inserts while registration is closed.
3. `supabase/ambassador-portal.sql` — links ambassador rows to Supabase Auth,
   adds the dashboard/referral RPCs, and tracks invite timestamps.
4. `supabase/email-deliveries.sql` — adds the email delivery audit table used by
   the backend.
5. `supabase/ambassador-accounts.sql` — adds CNIC/signup fields, the
   `complete_ambassador_setup()` and `get_ambassador_account()` RPCs, and the
   `invited` status used by the invitation flow.
6. `supabase/ambassador-referral-review.sql` — adds ambassador review of
   referred registrations: `ambassador_review_referral(...)` lets the
   ambassador who owns the referral code approve (participant) or reject a
   pending registration, and `get_ambassador_referrals()` returns the review
   timestamp.
7. `supabase/event-tracks.sql` — adds `public.event_tracks` (admin-editable
   overrides for the 18 event-page tracks), `get_public_tracks()` for the public
   pages, and `admin_track_stats()` for per-track registration counts. It also
   re-creates `register_for_event(...)` so a track the admin closes rejects new
   registrations.
8. `supabase/microsoft-graph-token-store.sql` — adds the backend-only encrypted
   refresh-token row used by the delegated Microsoft Graph mail provider.

The anon key still cannot read or write the registration tables directly. Fresh
projects can run `supabase/schema.sql` instead, which includes all of the above.

## Ambassador portal and email backend

The ambassador portal lives at `/ambassador`. The flow is:

1. An admin enters an ambassador's email in **Admin Portal → Ambassadors** and
   sends an invitation.
2. The backend creates a Supabase Auth invite and emails a one-time
   `/ambassador/setup?invite_token=...` link. The link goes directly to the
   site, so it does not depend on Supabase's redirect URL allow-list.
3. The ambassador opens `/ambassador/setup`, sets a password, and submits their
   name, phone, CNIC, and university. Their account becomes **pending approval**.
4. The admin reviews the account and approves or rejects it. Only approved
   ambassadors see the dashboard.
5. Afterwards the ambassador signs in at `/ambassador` with that email and
   password. **Forgot password?** asks the backend to email a one-time
   `/ambassador/setup?reset_token=...` link, which also goes directly to the
   site and does not depend on Supabase's redirect URL allow-list.

### Referral review

When a participant registers and picks a campus ambassador, the registration is
created as `pending` and appears in that ambassador's **Referred participants**
table. The ambassador can **Approve** it (it becomes an approved participant and
shows up in the admin roster) or **Reject** it. Each decision stamps
`ambassador_reviewed_by` / `ambassador_reviewed_at` on the registration and is
written to `audit_logs`. Admin approvals and rejections still work; only
registrations that are still `pending` can be reviewed by the ambassador, so an
admin decision is never overwritten from the portal.

In production, set `APP_URL=https://your-domain` in the backend environment.
When `APP_URL` is empty on Vercel, the backend derives the public origin from
`VERCEL_PROJECT_PRODUCTION_URL` instead of defaulting to localhost.

The admin list shows invite-sent, pending, approved, and rejected states, opens
full details for any ambassador, and can delete an account. Deleting an invitation
also removes its Supabase Auth user, so the same email can be invited again.
Deletes, invites, approvals, rejections, and email sends are all written to
`audit_logs`.

For local testing without the backend invite flow, run
`supabase/create-test-ambassador.sql` in the SQL Editor after replacing its
placeholder email and password. It seeds a ready-to-sign-in ambassador and
records a `SEED_TEST_AMBASSADOR` audit entry.

### Event page tracks (admin editing)

The 18 competition tracks published at `/tracks/:slug` are defined in
`src/data/tracks.js`. **Admin Portal → Event Page Tracks** lists every track with
live registration counts (total, pending, approved, waitlisted, rejected) and a
capacity gauge, and lets an admin edit the public page directly:

- name, category, description, venue, rules
- start date, end date, registration deadline
- capacity, min/max team size, team-size label
- fee, prize pool, winner and runner-up prizes, timings, duration, format,
  eligibility
- an independent **registration open/closed** switch per track
- **Open All Tracks / Close All Tracks** — one button that flips every track at once
- the **site-wide Public Registration master switch** (moved here when the old
  Events & Limits tab was retired)

Only edited fields are stored in `public.event_tracks`; `src/lib/tracks.js`
merges each row over the shipped defaults, so clearing a field or using **Reset
to shipped defaults** restores the original content. Admin writes and resets are
recorded in `audit_logs`.

When global registration is open, a track's own switch still gates the Register
button on its event page, and `register_for_event(...)` rejects submissions to a
closed track even if the form is submitted directly.

Transactional email is handled by the Express backend in `server/`. It uses:
- the backend-only Supabase Admin API to generate one-time ambassador invite
  and password-reset links;
- a delegated Microsoft Graph integration with the existing public-client
  registration;
- an encrypted refresh token stored in `public.microsoft_graph_token_store`,
  readable only by the backend service-role client;
- `POST /v1.0/me/sendMail` from the consented mailbox `cite@cuiatd.edu.pk`;
- a mock provider for local development.

A Graph `202` is recorded as **submitted**, not delivered. The access token is
cached in memory, the refresh token is AES-256-GCM encrypted in Supabase, and
neither is exposed to the frontend. Rotations update the Supabase row only if it
still has the token this process read. Device-code sign-in is an operator
provisioning step, never an API behavior.

Start both the frontend and backend with:

```bash
npm run dev
```

Run the mocked backend tests with:

```bash
npm test
```

After applying `supabase/microsoft-graph-token-store.sql`, temporarily set
`MS_GRAPH_REFRESH_TOKEN` in `.env` and provision the encrypted row without
sending email:

```bash
npm run provision:graph-token
```

Until the encrypted Supabase token row is provisioned, keep
`EMAIL_PROVIDER=mock`. Captured messages are written to `server/.mail-outbox/`
and no real email is sent. See `docs/microsoft-365-email-setup.md` for the
migration, encryption key, token provisioning, recovery, and live validation
checks.

Never put the Supabase service-role key, refresh token, or any Microsoft Graph
credential in a `VITE_` variable or the browser bundle.

## Architecture
- Clean-URL pages: Home, About, Events, Schedule, FAQ, Ambassador Portal.
- `src/App.jsx` owns history-based routing, page transitions, and route-level lazy loading.
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
