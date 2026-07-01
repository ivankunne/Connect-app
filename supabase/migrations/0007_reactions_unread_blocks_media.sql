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
