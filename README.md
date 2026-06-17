# BottledTalk

A location-aware web app where authenticated users drop message bottles on a map at their current GPS position. Other users within **2km** can discover bottles, open threads, and continue conversations until the bottle expires based on its type.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Auth, Postgres + PostGIS, Realtime
- **Mapbox GL JS** — interactive map

## Features

- Required sign-in (email/password)
- **Bottle caps** currency (100 starter) — all bottles cost caps to cast
- **Bag** (10 slots) — save conversations manually or when they wash ashore
- Map clustering when many bottles share the same spot
- Map centered on your location with a 2km discovery circle
- Drop bottles with title + first message at current GPS
- Four bottle types with different lifetimes:
  - Glass — 24 hours
  - Cork — 3 days
  - Driftwood — 7 days
  - Treasure — 30 days
- Realtime message threads
- Expired bottles hidden from map and threads

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In the SQL Editor, run migrations in order:
   - [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
   - [`supabase/migrations/003_caps_and_bag.sql`](supabase/migrations/003_caps_and_bag.sql) (bottle caps, bag, economy)
3. Under **Authentication → Providers**, enable Email.
4. Copy your project URL and anon key from **Settings → API**.

### 3. Get a Mapbox token

1. Create an account at [mapbox.com](https://mapbox.com).
2. Copy your public access token from the dashboard.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-public-token
```

The map uses Mapbox **outdoors-v12** (colorful terrain style) built into the app — no style env var needed.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Expired bottle cleanup (optional)

Run `cleanup_expired_bottles()` periodically to remove expired rows from the database.

**Option A — Supabase SQL cron** (if `pg_cron` is enabled):

```sql
select cron.schedule(
  'cleanup-expired-bottles',
  '0 3 * * *',
  $$ select public.cleanup_expired_bottles(); $$
);
```

**Option B — Edge Function**

Deploy `supabase/functions/cleanup-expired` and schedule it via Supabase cron or an external scheduler. Set `CRON_SECRET` and pass `Authorization: Bearer <CRON_SECRET>`.

## Deploy

Deploy the Next.js app to [Vercel](https://vercel.com) with the same environment variables. Add your production URL to Supabase **Authentication → URL Configuration** redirect allowlist.

For custom domain setup (`bottledtalk.com` / `www.bottledtalk.com`), see [docs/DOMAIN_SETUP.md](docs/DOMAIN_SETUP.md).

**Add to Home Screen:** Works on HTTPS (production). Mobile users see an install banner on the landing page and map. Requires the web app manifest and service worker included in the project.

## Project structure

```
app/
  map/           — main map experience
  bottle/[id]/   — conversation thread
  (auth)/        — login & signup
components/
  map/           — Mapbox map
  bottles/       — markers, drop modal, messages
lib/
  supabase/      — client, server, middleware helpers
  geo.ts         — countdown & discovery circle helpers
supabase/
  migrations/    — database schema
```
