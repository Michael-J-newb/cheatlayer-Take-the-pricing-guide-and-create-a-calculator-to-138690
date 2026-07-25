# Family Photo Timeline

Family members log in, upload trip photos from their phones, and see them
assembled into one chronological timeline with a colored "pill" showing who
uploaded each photo. Built by repurposing Vercel's Next.js Subscription
Payments Starter (Stripe fully stripped out).

Working branch: `claude/family-photo-timeline-dfv9u0` (all app code lives
here; `main` still holds the untouched starter).

## Stack

- Next.js 14 App Router + React 18 + Tailwind, TypeScript
- Supabase: auth, Postgres, Storage. Project `family-photo-timeline`
  (ref `ktidtqvmmcojzkrpyapo`, us-east-1)
- `@supabase/supabase-js` pinned to **2.43.4** — newer 2.x changes the
  client generics and breaks against `@supabase/ssr@0.1.0`. Don't bump
  casually.
- `archiver` pinned to **v7** — v8's package exports break Next 14 webpack.
- `exifr` (client EXIF), `sharp` + `heic-convert` (server HEIC→JPEG
  previews; sharp's prebuilt libvips cannot decode HEIC, heic-convert does
  the decode, sharp the resize).

## Environment (.env.local — gitignored, recreate locally)

```
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://ktidtqvmmcojzkrpyapo.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0aWR0cXZtbWNvanprcnB5YXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY5NzgsImV4cCI6MjEwMDUwMjk3OH0.bnjcQCywlAXHLIaP0XOLw90yKpmHmuYWD8YMZmqHi_c"
SUPABASE_SERVICE_ROLE_KEY=   # paste from dashboard → project settings → API
```

The service-role key is REQUIRED for uploads, HEIC previews, geocoding
writes, and zip downloads. Auth/browsing work without it.

## Commands

- `pnpm install` then `pnpm dev` — run locally
- `npx tsc --noEmit` and `pnpm lint` — checks (no test suite exists;
  run both after every change)
- `pnpm build` — must pass before pushing

## Architecture

- Data model: `families` → `family_members` (role owner|member, invite
  codes in `family_invites`) → `timelines` (one per trip/event — future
  billable unit) → `photos` → `photo_likes`. Support tables:
  `geocode_cache`, `timeline_views`.
- Timeline sort is ALWAYS `captured_at ?? uploaded_at` (EXIF unreliable;
  `captured_at_source` marks the fallback, UI shows "date estimated").
- GPS: raw `gps_lat/gps_lng` stored but NEVER rendered; only the
  city-level `location_town` (Nominatim reverse geocode, rounded to 2dp,
  cached in `geocode_cache`) is displayed.
- RLS is the security boundary. All membership checks go through
  `security definer` helpers (`is_family_member`, `is_family_owner`,
  `is_timeline_member`, …) — NEVER inline a `family_members` self-query in
  a policy (recursive RLS trap) and never weaken a policy to fix a
  recursion error.
- Storage: private bucket `family-photos`, paths
  `familyId/timelineId/<uuid>-<name>`, signed URLs minted server-side.
  `preview_storage_path` = server-generated JPEG for HEIC originals.
- Server actions in `utils/{family,timeline,photo}-helpers/server.ts`
  insert through the user-scoped client so RLS stays the enforcement
  point; the admin client (`utils/supabase/admin.ts`, service role) is
  used only AFTER an explicit membership check (signed upload URLs,
  previews, zip streaming, geocode cache).
- Zip downloads (`app/api/family/[familyId]/[timelineId]/download`):
  Node runtime, archiver streaming, per-file just-in-time fetch inside
  the loop, one-retry-then-skip with `warnings.txt`.
- Duplicates: `checksum_sha256` per timeline is FLAGGED in the UI, never
  silently blocked or merged.
- Deletes: uploader-only (RLS). Storage objects removed only when no
  other row references the path.

## Migrations

`supabase/migrations/` mirrors what is applied to the remote project
(init, user-FK retarget to public.users for PostgREST embeds,
timeline_views). `schema.sql` is the current-state reference doc. After
schema changes: apply migration remotely AND update `types_db.ts`
(hand-maintained to match; include Relationships entries for every FK or
supabase-js infers embeds as arrays).

## Deferred features (agreed, not built)

Leaflet/OSM "join the dots" trip map + map-driven slideshow (plane/car
animation between location stops), Google Drive export (owner-managed
folder sync + per-member export), ffmpeg/AI trip recap videos, video
uploads, pay-per-timeline or annual-pass billing (schema already supports
via `timelines`), comments.

## Deployment (not yet done)

Vercel import of this repo, production branch set to the working branch,
three env vars (the two public ones above + service-role key). After
deploy: set Supabase Auth → URL Configuration → Site URL + Redirect URLs
to the live domain, or signup emails redirect to localhost.
