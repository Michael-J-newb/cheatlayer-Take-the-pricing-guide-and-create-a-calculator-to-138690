# PRD — Family Photo Timeline

**Version:** 1.0 · **Date:** 2026-07-28 · **Owner:** Michael
**Status of MVP:** BUILT and pushed to branch `claude/family-photo-timeline-dfv9u0` (deployment pending). This PRD documents both the product intent and what already exists, so a new agent can distinguish "maintain/extend" from "build."

---

## 1. Problem

After a family trip, everyone's photos are trapped on individual phones. No
single person has the full story of the trip, sharing happens ad hoc over
text threads, and nobody can browse or download the complete set. Existing
tools don't fit: shared cloud albums don't show clear per-person
attribution or a merged chronological narrative, and require everyone to be
inside one vendor's ecosystem.

## 2. Product summary

A private web app where a family member sets up a **family**, invites
relatives with a shareable **invite code**, and creates a **timeline** per
trip or event. Everyone uploads their photos from their phones; the app
merges them into one chronological timeline using photo metadata, with a
colored **pill on each photo identifying the uploader**. Members can
browse, like, filter, and download any or all photos. Trips accumulate as
clickable cards over the years.

## 3. Goals / Non-goals

**Goals (MVP — all built):**
- Zero-friction onboarding for non-technical relatives (email/password or
  magic link; join via a texted code; no third-party OAuth required)
- Faithful chronological merge across uploaders, resilient to missing/bad
  EXIF
- Clear per-photo attribution (uploader pill) and per-person filtering
- Bulk and selective download (zip), including "photos I liked"
- Privacy-safe location: show town/city only, never street-level or raw GPS

**Non-goals (MVP):**
- Native mobile apps (responsive web only)
- Video upload, comments, email notifications, public sharing links
- Google Drive as the storage backend (explicitly evaluated and rejected —
  see §10 Decision log)

## 4. Users

- **Family owner** — creates the family, generates/revokes invite codes,
  can remove members, sets timeline cover photos. Usually the person who
  sets everything up.
- **Family member** — joins via code, creates timelines, uploads photos,
  likes/filters/downloads, deletes own uploads only.

Single-family usage is the near-term reality; the schema supports many
families per user (multi-tenant) so a paid product remains possible.

## 5. Functional requirements (and implementation status)

| # | Requirement | Status |
|---|---|---|
| F1 | Email/password + magic-link auth; profile row auto-created on signup | ✅ built (Supabase Auth, `handle_new_user` trigger) |
| F2 | Create family (creator becomes owner) | ✅ built |
| F3 | Join family via reusable invite code (expires after 30 days; owner can regenerate/revoke; one active code per family) | ✅ built |
| F4 | Create timeline (any member) — one per trip/event | ✅ built |
| F5 | Timeline cards on family page: cover photo (earliest photo default, owner-overridable), name, photo count, date range | ✅ built |
| F6 | Multi-file upload: drag-drop or picker, per-file progress, one-at-a-time so a failed file never kills the batch, one auto-retry + manual retry | ✅ built |
| F7 | Chronological order = EXIF `DateTimeOriginal`, fallback to upload time, with visible "date estimated" marker on fallback | ✅ built |
| F8 | HEIC support: server generates a 1600px JPEG preview for every photo (heic-convert + sharp) so grids render on all browsers; original preserved for download | ✅ built |
| F9 | Uploader pill: deterministic color per member, click to filter grid to that person | ✅ built |
| F10 | Location display: city-level only ("Asheville, NC") via Nominatim reverse geocode, coordinates rounded to 2dp, cached; raw GPS stored but never rendered/sent to client | ✅ built |
| F11 | Likes: per-user heart toggle with count; "Liked by me" filter | ✅ built |
| F12 | Duplicate detection: SHA-256 checksum per timeline; duplicates are FLAGGED in UI, never blocked or merged | ✅ built |
| F13 | Downloads: zip of selected / all / my-liked photos, streamed server-side, per-file fetch inside the loop, skip-with-warnings.txt on per-file failure | ✅ built |
| F14 | Delete: uploader-only (enforced by RLS); storage object removed only when no other row references it | ✅ built |
| F15 | "+N new" badge on timeline cards for photos uploaded by others since the member's last visit | ✅ built |

## 6. Architecture (as built)

- **Stack:** Next.js 14 App Router, React 18, Tailwind, TypeScript.
  Repurposed from Vercel's Next.js Subscription Payments Starter (all
  Stripe code removed).
- **Backend:** Supabase project `family-photo-timeline`
  (ref `ktidtqvmmcojzkrpyapo`, us-east-1) — Auth, Postgres, Storage
  (private bucket `family-photos`, signed URLs minted server-side).
- **Data model:** `families` → `family_members` (role owner|member) →
  `timelines` → `photos` → `photo_likes`; support tables `family_invites`,
  `geocode_cache`, `timeline_views`. Photos hang off timelines (not
  families) because the timeline is the future billable unit.
- **Security model:** Postgres RLS is the enforcement boundary, not app
  code. All membership checks go through `security definer` helper
  functions (`is_family_member`, `is_family_owner`, `is_timeline_member`,
  `is_photo_family_member`, `shares_family_with`) to avoid the recursive
  RLS trap. Server actions write through the user-scoped client; the
  service-role client is used only after an explicit membership check
  (signed upload URLs, previews, zip streaming, geocode cache).
- **Pinned versions (do not bump casually):**
  `@supabase/supabase-js@2.43.4` (newer generics break `@supabase/ssr@0.1.0`),
  `archiver@7` (v8 exports break Next 14 webpack).
- Full technical detail lives in `CLAUDE.md` and `schema.sql` in the repo.

## 7. Deployment status & required setup

- Code: branch `claude/family-photo-timeline-dfv9u0` on
  `Michael-J-newb/cheatlayer-Take-the-pricing-guide-and-create-a-calculator-to-138690`
  (public). `main` still holds the untouched starter.
- Database/storage: all migrations applied to the live Supabase project.
- **Not yet done:** Vercel deployment (import repo, set production branch
  to the working branch, env vars `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); Supabase
  Auth Site URL/Redirect URLs must then be set to the live domain.
- **Known gap:** end-to-end verification with two real accounts has not
  been run (signup → invite join → mixed HEIC/no-EXIF upload → filters →
  zips → RLS delete checks). This is the first thing to do post-deploy.
  Supabase's dashboard security advisor scan should also be run once.

## 8. Phase 2 roadmap (agreed, in rough priority order — none built)

1. **Interactive trip map ("join the dots")** — Leaflet + OSM tiles (free,
   no key), plotting stored `gps_lat/gps_lng` per timeline connected in
   captured-at order. Per-trip map first; all-trips aggregate later.
2. **Map-driven slideshow** — group consecutive photos sharing a
   `location_town` into "stops"; play a stop's photos, animate a travel
   icon along the route to the next stop, auto-open the next group on
   arrival. Derived at render time; no schema change.
3. **Google Drive EXPORT** (not storage): (a) owner connects Drive once,
   background job mirrors new uploads into a family folder; (b) optional
   per-member one-off "export selection to my Drive." New table
   `drive_connections`; reuse `checksum_sha256` to skip already-exported.
4. **Trip recap videos** — prototype free ffmpeg Ken-Burns slideshow
   first; evaluate Higgsfield or similar image-to-video API after.
5. **Monetization** — pay-per-timeline (flat fee per trip, matches bursty
   family travel; precedent: wedding guest-photo apps) and/or annual
   family pass. Schema is ready (timeline = billable unit); needs Stripe
   Checkout scoped to timeline/family. Explicitly NOT a monthly
   subscription.
6. Video uploads, comments, email notifications — backlog, unprioritized.

## 9. Success criteria (MVP)

- A non-technical relative can go from invite text → viewing the trip in
  under 3 minutes without help.
- A mixed 50-photo upload (HEIC + JPEG, some GPS-stripped) lands fully,
  ordered correctly, with previews visible on Android/Chrome.
- Zero cross-family data visibility (RLS verified with a non-member
  account).
- "Download all" on a full trip produces a complete zip.

## 10. Decision log (do not relitigate without new information)

- **Supabase Storage over Google Drive as backend** — 5-advisor LLM
  council review: per-relative OAuth is an adoption wall, Drive quota/rate
  limits hit at the worst moment, ownership ambiguity, no native ordering/
  attribution → shadow DB required anyway. Drive returns as an *export*
  target in Phase 2.
- **family → timelines → photos** (not family → photos) — timeline is the
  UX unit (trip cards) and future billable unit.
- **Town-level location only** — privacy default for minors/home
  locations; raw GPS retained server-side for the Phase 2 map.
- **Duplicates flagged, never auto-merged** — two relatives legitimately
  photograph the same moment.
- **Uploader-only deletes; removing a member keeps their past uploads.**
- **Invite codes reusable until expiry** — matches "text the code to the
  family group chat."
- **Server-side JPEG previews for HEIC** — client-side conversion and
  "accept broken thumbnails" were considered and rejected.
