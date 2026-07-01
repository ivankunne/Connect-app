# HomeLink

A community platform for people living outside their country of birth. HomeLink
automatically places each member into the communities that matter to them — their
**home-country diaspora**, their **current country**, and their **city** — and drops
them straight into a live chat so they never land in an empty room.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui** on
**Supabase** (Auth, Postgres, Realtime, Storage). Deployable to Vercel.

---

## Features

- **Auth** — email/password + Google OAuth (Supabase Auth).
- **Forced onboarding** — name, photo, home country, current country, city, languages, interests.
- **Automatic community assignment** — on signup and on every profile change, the user is placed into:
  - `Global`
  - `{CurrentCountry}` (e.g. *Norway*)
  - `{CurrentCountry} - {City}` (e.g. *Norway - Bergen*)
  - `{Demonym} in {CurrentCountry}` (e.g. *Spanish in Norway*)
  - `{Demonym} in {City}` (e.g. *Spanish in Bergen*)
  - Communities are **deduplicated by a natural `slug` key** — the same location always reuses the same community.
- **Anti-empty system** — quiet communities (< 10 members) surface a broader sibling and a "it's quiet here" nudge, so no one lands in a dead chat.
- **Realtime chat** — one message stream per community, filtered by category channel (General, Questions, Housing, Jobs, Events, Marketplace, Food). Paginated 50 at a time, delete-your-own, day dividers, grouping.
- **Events** — create, RSVP once (updatable), attendee lists, and a realtime comment thread per event.
- **Feed** — a strictly chronological, realtime feed aggregating posts across **all** your communities, plus a per-community feed.
- **Search** — users, communities, and events.
- **Discord-inspired 3-column layout** — communities rail · main panel (chat/events/feed) · context panel (about, events, members). Mobile-first with a bottom nav + community drawer.

Editor/user-facing copy is **Norwegian (Bokmål)**; all code is English.

---

## Tech & architecture

```
src/
  app/
    page.tsx                     Marketing landing (SSR, JSON-LD)
    login/ signup/               Auth (split-screen)
    auth/callback/ auth/signout/ OAuth + email-confirm + logout routes
    onboarding/                  Forced onboarding wizard + server action
    app/                         Authenticated shell (force-dynamic)
      layout.tsx                 Loads profile + communities -> AppShell
      page.tsx                   Entry-flow: pick landing community -> redirect
      c/[communityId]/           Community view (chat | events | feed) + context panel
      feed/  search/  profile/  u/[userId]/
  components/                    UI primitives (shadcn), app shell, chat, events, feed...
  lib/
    supabase/                    client - server - admin (service role) - proxy session
    communities.ts               slug/dedup + generation + landing + empty-state logic
    countries.ts  constants.ts  data.ts  time.ts  types.ts  database.types.ts
  proxy.ts                       Session refresh + route guards (Next 16 proxy)
supabase/
  migrations/                    schema - RLS - views - storage
  seed.sql                       Mandatory seed communities
```

State model (per spec): the **active community**, **channel**, and **view** live in the
URL (`/app/c/{id}?view=chat&channel=general`). Switching community resets the channel to
General; switching channel keeps the community. Only the active view's data is fetched.

Community writes go through the **service role** (`src/lib/actions/assign.ts`) because
creating a shared community must succeed even when the current user isn't its "owner";
everything else runs under **Row Level Security** as the signed-in user.

---

## Setup

### 1. Create a Supabase project

Grab the values from **Project Settings -> API** and copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server-only, never exposed to the client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> A `.env.local` with placeholder values is included so the project builds before Supabase is wired up. Replace it with real values before running the app for real.

### 2. Run the database migrations

In the Supabase **SQL Editor**, run the files in `supabase/migrations/` **in order**:

1. `0001_schema.sql` — tables + enums + indexes
2. `0002_rls.sql` — RLS policies, `handle_new_user` trigger, realtime publication
3. `0003_views.sql` — `communities_with_counts` view
4. `0004_storage.sql` — `avatars` storage bucket + policies

Then run `supabase/seed.sql` to create the mandatory seed communities (Global, Norway,
Oslo, Bergen, Spanish/Polish/German in Norway) so the app is never empty.

> Using the Supabase CLI instead? `supabase db reset` picks up `migrations/` and `seed.sql` automatically.

### 3. Enable Google login (optional)

Supabase **Authentication -> Providers -> Google**: add your Google OAuth client ID/secret,
and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect
allow-list. Email/password works out of the box.

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign up, and you'll be routed through onboarding into your
first community chat.

---

## Deploy (Vercel)

1. Push to a Git repo and import into Vercel.
2. Add the four environment variables (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Add the production `.../auth/callback` URL to Supabase Auth redirects.

---

## Notes & assumptions

- The spec's `users` table is implemented as **`profiles`** (Supabase convention) to avoid shadowing the built-in `auth.users`; every other table matches the spec.
- **Feed** is the aggregated cross-community view (spec §6); inside a community the tabs are Chat / Events / Feed, where the community Feed shows that community's posts.
- Diaspora communities are only generated when home country != current country.
- Regenerate `src/lib/database.types.ts` with the Supabase CLI once your schema is live for exact type parity.
