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
