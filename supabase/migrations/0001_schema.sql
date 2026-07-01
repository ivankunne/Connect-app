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
