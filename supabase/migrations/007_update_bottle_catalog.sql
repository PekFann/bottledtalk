-- Replace legacy bottle catalog (Glass/Cork/Driftwood/Treasure) with Shop catalog.

set search_path = public, extensions;

alter table public.bottle_types
  add column if not exists is_sealed boolean not null default false;

alter table public.bottle_types
  add column if not exists cap_cost integer not null default 10;

update public.bottle_types set
  slug = 'basic-day',
  name = '1 Day',
  description = 'Quick notes that wash away in a day',
  duration_hours = 24,
  cap_cost = 10,
  is_sealed = false,
  icon = '🍾',
  marker_color = '#60a5fa'
where slug = 'glass';

update public.bottle_types set
  slug = 'basic-week',
  name = '1 Week',
  description = 'Conversations that last a week',
  duration_hours = 168,
  cap_cost = 50,
  is_sealed = false,
  icon = '🪵',
  marker_color = '#34d399'
where slug = 'cork';

update public.bottle_types set
  slug = 'basic-month',
  name = '1 Month',
  description = 'Long stories that last 30 days',
  duration_hours = 720,
  cap_cost = 120,
  is_sealed = false,
  icon = '🌊',
  marker_color = '#fbbf24'
where slug = 'driftwood';

update public.bottle_types set
  slug = 'sealed',
  name = 'Sealed',
  description = 'Password-protected bottle — lasts 7 days',
  duration_hours = 168,
  cap_cost = 75,
  is_sealed = true,
  icon = '🔒',
  marker_color = '#a78bfa'
where slug = 'treasure';

insert into public.bottle_types (slug, name, description, duration_hours, icon, marker_color, cap_cost, is_sealed)
select v.slug, v.name, v.description, v.duration_hours, v.icon, v.marker_color, v.cap_cost, v.is_sealed
from (values
  ('basic-day', '1 Day', 'Quick notes that wash away in a day', 24, '🍾', '#60a5fa', 10, false),
  ('basic-week', '1 Week', 'Conversations that last a week', 168, '🪵', '#34d399', 50, false),
  ('basic-month', '1 Month', 'Long stories that last 30 days', 720, '🌊', '#fbbf24', 120, false),
  ('sealed', 'Sealed', 'Password-protected bottle — lasts 7 days', 168, '🔒', '#a78bfa', 75, true)
) as v(slug, name, description, duration_hours, icon, marker_color, cap_cost, is_sealed)
where not exists (
  select 1 from public.bottle_types
  where slug in ('basic-day', 'basic-week', 'basic-month', 'sealed')
);

notify pgrst, 'reload schema';
