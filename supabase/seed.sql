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
