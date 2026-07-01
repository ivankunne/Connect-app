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
