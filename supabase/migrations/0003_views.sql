-- HomeLink — read helpers

-- Communities with a live member count. security_invoker keeps RLS in effect.
create or replace view public.communities_with_counts
with (security_invoker = true)
as
  select
    c.*,
    (select count(*) from public.memberships m where m.community_id = c.id) as member_count
  from public.communities c;
