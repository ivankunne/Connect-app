-- Track whether a membership was auto-assigned from the profile or joined
-- manually, so profile updates can prune stale auto memberships (e.g. the old
-- country after moving) without touching communities the user chose to join.
alter table public.memberships
  add column if not exists source text not null default 'auto'
  check (source in ('auto', 'manual'));
