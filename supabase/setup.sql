-- HomeLink — complete database setup.
-- Paste this whole file into the Supabase SQL Editor and run once.


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
-- supabase/migrations/0005_membership_source.sql
-- ============================================================
-- Track whether a membership was auto-assigned from the profile or joined
-- manually, so profile updates can prune stale auto memberships (e.g. the old
-- country after moving) without touching communities the user chose to join.
alter table public.memberships
  add column if not exists source text not null default 'auto'
  check (source in ('auto', 'manual'));


-- ============================================================
-- supabase/migrations/0006_direct_messages.sql
-- ============================================================
-- 1:1 private messages between two users.
create table if not exists public.direct_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 4000),
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists dm_pair_idx on public.direct_messages (sender_id, recipient_id, created_at);
create index if not exists dm_recipient_idx on public.direct_messages (recipient_id, read_at);

alter table public.direct_messages enable row level security;

create policy "dm_select_participant" on public.direct_messages
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "dm_insert_own" on public.direct_messages
  for insert to authenticated
  with check (sender_id = auth.uid());

create policy "dm_update_recipient" on public.direct_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

alter publication supabase_realtime add table public.direct_messages;
alter table public.direct_messages replica identity full;

-- Inbox helper: latest message per conversation partner + unread count for
-- the current user.
create or replace function public.get_dm_threads()
returns table (partner_id uuid, last_content text, last_at timestamptz, unread integer)
language sql
security definer
set search_path = public
stable
as $$
  with msgs as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end as partner,
      content,
      created_at
    from public.direct_messages
    where sender_id = auth.uid() or recipient_id = auth.uid()
  ),
  ranked as (
    select partner, content, created_at,
           row_number() over (partition by partner order by created_at desc) as rn
    from msgs
  )
  select
    r.partner as partner_id,
    r.content as last_content,
    r.created_at as last_at,
    (select count(*)::int from public.direct_messages d
       where d.recipient_id = auth.uid() and d.sender_id = r.partner and d.read_at is null) as unread
  from ranked r
  where r.rn = 1
  order by r.created_at desc;
$$;

revoke execute on function public.get_dm_threads() from public, anon;
grant execute on function public.get_dm_threads() to authenticated;


-- ============================================================
-- supabase/migrations/0007_reactions_unread_blocks_media.sql
-- ============================================================
-- Unread tracking
alter table public.memberships
  add column if not exists last_read_at timestamptz not null default now();

-- Message reactions
create table if not exists public.message_reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);
create index if not exists reactions_message_idx on public.message_reactions (message_id);
alter table public.message_reactions enable row level security;
create policy "reactions_select_member" on public.message_reactions
  for select to authenticated using (
    exists (select 1 from public.messages m where m.id = message_id and public.is_member(m.community_id))
  );
create policy "reactions_insert_own" on public.message_reactions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.messages m where m.id = message_id and public.is_member(m.community_id))
  );
create policy "reactions_delete_own" on public.message_reactions
  for delete to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.message_reactions;
alter table public.message_reactions replica identity full;

-- Blocks
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "blocks_select_own" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "blocks_insert_own" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks_delete_own" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- Reports
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('message', 'user', 'post', 'dm')),
  target_id   uuid not null,
  reason      text,
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports_insert_own" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports_select_own" on public.reports for select to authenticated using (reporter_id = auth.uid());

-- Rich messages (allow image-only messages with empty text)
alter table public.messages add column if not exists image_url text;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (char_length(content) <= 4000);
alter table public.messages alter column content set default '';
insert into storage.buckets (id, name, public) values ('chat', 'chat', true) on conflict (id) do nothing;
create policy "chat_public_read" on storage.objects for select using (bucket_id = 'chat');
create policy "chat_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chat_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text);

-- DM: block-aware insert
drop policy if exists "dm_insert_own" on public.direct_messages;
create policy "dm_insert_own" on public.direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and not exists (select 1 from public.blocks b where b.blocker_id = recipient_id and b.blocked_id = auth.uid())
  );

-- Unread counts + mark read
create or replace function public.get_unread_counts()
returns table (community_id uuid, unread integer)
language sql security definer set search_path = public stable as $$
  select m.community_id,
    (select count(*)::int from public.messages msg
       where msg.community_id = m.community_id and msg.created_at > m.last_read_at and msg.user_id <> auth.uid()) as unread
  from public.memberships m where m.user_id = auth.uid();
$$;
revoke execute on function public.get_unread_counts() from public, anon;
grant execute on function public.get_unread_counts() to authenticated;

create or replace function public.mark_community_read(target_community uuid)
returns void language sql security definer set search_path = public as $$
  update public.memberships set last_read_at = now()
  where user_id = auth.uid() and community_id = target_community;
$$;
revoke execute on function public.mark_community_read(uuid) from public, anon;
grant execute on function public.mark_community_read(uuid) to authenticated;


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

