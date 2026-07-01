-- HomeLink — complete database setup.
-- Paste this whole file into the Supabase SQL Editor and run once.
-- (Combines migrations 0001–0004 + seed, in order.)


-- ============================================================
-- supabase/migrations/0001_schema.sql
-- ============================================================
-- HomeLink — core schema
-- Naming note: the product spec calls this table `users`; we use `profiles`
-- (the Supabase convention) to avoid shadowing the built-in `auth.users`.
-- Every other table matches the spec.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type community_type as enum ('global', 'country', 'city', 'diaspora', 'hybrid');
create type message_category as enum ('general', 'questions', 'housing', 'jobs', 'events', 'marketplace', 'food');
create type rsvp_status as enum ('going', 'maybe', 'not_going');

-- ---------------------------------------------------------------------------
-- profiles  (spec: users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  name             text not null default '',
  avatar_url       text,
  home_country     text,
  current_country  text,
  city             text,
  languages        text[] not null default '{}',
  interests        text[] not null default '{}',
  onboarded        boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- communities
-- ---------------------------------------------------------------------------
create table public.communities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,          -- natural key used for dedup
  type          community_type not null,
  country       text,
  city          text,
  home_country  text,
  created_at    timestamptz not null default now()
);

create index communities_type_idx on public.communities (type);

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  community_id  uuid not null references public.communities (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, community_id)
);

create index memberships_user_idx on public.memberships (user_id);
create index memberships_community_idx on public.memberships (community_id);

-- ---------------------------------------------------------------------------
-- messages  (single table; category is a filter, not a separate chat)
-- ---------------------------------------------------------------------------
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references public.communities (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  category      message_category not null default 'general',
  content       text not null check (char_length(content) between 1 and 4000),
  created_at    timestamptz not null default now()
);

create index messages_stream_idx on public.messages (community_id, category, created_at desc);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id             uuid primary key default gen_random_uuid(),
  community_id   uuid not null references public.communities (id) on delete cascade,
  creator_id     uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  description    text,
  datetime       timestamptz not null,
  location       text,
  max_attendees  integer,
  created_at     timestamptz not null default now()
);

create index events_community_idx on public.events (community_id, datetime);

-- ---------------------------------------------------------------------------
-- event_attendees  (one RSVP per user per event)
-- ---------------------------------------------------------------------------
create table public.event_attendees (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- event_comments  (event thread)
-- ---------------------------------------------------------------------------
create table public.event_comments (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index event_comments_event_idx on public.event_comments (event_id, created_at);

-- ---------------------------------------------------------------------------
-- posts  (feed)
-- ---------------------------------------------------------------------------
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references public.communities (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  title         text,
  content       text not null check (char_length(content) between 1 and 8000),
  created_at    timestamptz not null default now()
);

create index posts_community_idx on public.posts (community_id, created_at desc);


-- ============================================================
-- supabase/migrations/0002_rls.sql
-- ============================================================
-- HomeLink — Row Level Security & helpers

-- Membership helper (SECURITY DEFINER so policies don't recurse into RLS).
create or replace function public.is_member(target_community uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.community_id = target_community
      and m.user_id = auth.uid()
  );
$$;

-- Create a profile row automatically when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.communities     enable row level security;
alter table public.memberships     enable row level security;
alter table public.messages        enable row level security;
alter table public.events          enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_comments  enable row level security;
alter table public.posts           enable row level security;

-- profiles: anyone signed in can read (needed for search & message authors);
-- users manage only their own row.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- communities: readable by all signed-in users. Writes happen through the
-- service role (assignment + seed), which bypasses RLS.
create policy "communities_select" on public.communities
  for select to authenticated using (true);

-- memberships: readable by all signed-in users (member counts / active users);
-- users may join/leave their own memberships.
create policy "memberships_select" on public.memberships
  for select to authenticated using (true);
create policy "memberships_insert_own" on public.memberships
  for insert to authenticated with check (user_id = auth.uid());
create policy "memberships_delete_own" on public.memberships
  for delete to authenticated using (user_id = auth.uid());

-- messages: visible to community members; authors post as themselves and may
-- delete their own messages.
create policy "messages_select_member" on public.messages
  for select to authenticated using (public.is_member(community_id));
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(community_id));
create policy "messages_delete_own" on public.messages
  for delete to authenticated using (user_id = auth.uid());

-- events
create policy "events_select_member" on public.events
  for select to authenticated using (public.is_member(community_id));
create policy "events_insert_member" on public.events
  for insert to authenticated
  with check (creator_id = auth.uid() and public.is_member(community_id));
create policy "events_update_own" on public.events
  for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "events_delete_own" on public.events
  for delete to authenticated using (creator_id = auth.uid());

-- event_attendees
create policy "attendees_select_member" on public.event_attendees
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_id and public.is_member(e.community_id))
  );
create policy "attendees_write_own" on public.event_attendees
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- event_comments
create policy "event_comments_select_member" on public.event_comments
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_id and public.is_member(e.community_id))
  );
create policy "event_comments_insert_own" on public.event_comments
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.events e where e.id = event_id and public.is_member(e.community_id))
  );
create policy "event_comments_delete_own" on public.event_comments
  for delete to authenticated using (user_id = auth.uid());

-- posts (feed)
create policy "posts_select_member" on public.posts
  for select to authenticated using (public.is_member(community_id));
create policy "posts_insert_member" on public.posts
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(community_id));
create policy "posts_delete_own" on public.posts
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: publish the tables the client subscribes to.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.event_attendees;

-- REPLICA IDENTITY FULL so DELETE events include the columns we filter on
-- (e.g. community_id) — otherwise only the primary key is sent and filtered
-- deletes are dropped.
alter table public.messages replica identity full;
alter table public.posts replica identity full;


-- ============================================================
-- supabase/migrations/0003_views.sql
-- ============================================================
-- HomeLink — read helpers

-- Communities with a live member count. security_invoker keeps RLS in effect.
create or replace view public.communities_with_counts
with (security_invoker = true)
as
  select
    c.*,
    (select count(*) from public.memberships m where m.community_id = c.id) as member_count
  from public.communities c;


-- ============================================================
-- supabase/migrations/0004_storage.sql
-- ============================================================
-- HomeLink — avatar storage bucket (public read, users write their own folder).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Users may write only inside a folder named after their own uid: avatars/<uid>/...
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================
-- supabase/seed.sql
-- ============================================================
-- HomeLink — mandatory seed so no user ever sees an empty app.
-- Slugs are the natural dedup key and MUST match the format produced by
-- src/lib/communities.ts (buildCommunitySlug).

insert into public.communities (name, slug, type, country, city, home_country) values
  ('Global',              'global',                      'global',   null,     null,    null),
  ('Norway',              'country:norway',              'country',  'Norway', null,    null),
  ('Norway - Oslo',       'city:norway:oslo',            'city',     'Norway', 'Oslo',  null),
  ('Norway - Bergen',     'city:norway:bergen',          'city',     'Norway', 'Bergen',null),
  ('Spanish in Norway',   'diaspora:spain:norway',       'diaspora', 'Norway', null,    'Spain'),
  ('Polish in Norway',    'diaspora:poland:norway',      'diaspora', 'Norway', null,    'Poland'),
  ('German in Norway',    'diaspora:germany:norway',     'diaspora', 'Norway', null,    'Germany')
on conflict (slug) do nothing;

