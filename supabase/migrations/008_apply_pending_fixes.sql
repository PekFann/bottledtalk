-- One-shot fix: drop_bottle (006) + bottle catalog (007) + admin caps (005)
-- Run entire file in Supabase SQL Editor.

-- ── 006: drop_bottle with sealed-bottle params ──────────────────────────────

create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

alter table public.bottle_types
  add column if not exists is_sealed boolean not null default false;

alter table public.bottles
  add column if not exists description text,
  add column if not exists is_sealed boolean not null default false,
  add column if not exists pin_hash text;

create or replace function public.drop_bottle(
  p_bottle_type_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_title text,
  p_message text,
  p_description text default null,
  p_pin text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_bottle_id uuid;
  uid uuid := auth.uid();
  cost integer;
  balance integer;
  type_rec record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select cap_cost, is_sealed into type_rec
  from public.bottle_types
  where id = p_bottle_type_id;

  if type_rec.cap_cost is null then
    raise exception 'Invalid bottle type';
  end if;

  cost := type_rec.cap_cost;

  if type_rec.is_sealed then
    if p_description is null or trim(p_description) = '' then
      raise exception 'Sealed bottles require a description';
    end if;
    if p_pin is null or p_pin !~ '^\d{4}$' then
      raise exception 'Sealed bottles require a 4-digit PIN';
    end if;
  end if;

  select bottle_caps into balance
  from public.profiles
  where id = uid
  for update;

  if balance < cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles
  set bottle_caps = bottle_caps - cost
  where id = uid;

  insert into public.bottles (
    creator_id, bottle_type_id, location, title, description,
    is_sealed, pin_hash, expires_at
  )
  values (
    uid,
    p_bottle_type_id,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    p_title,
    p_description,
    type_rec.is_sealed,
    case when type_rec.is_sealed then crypt(p_pin, gen_salt('bf')) else null end,
    now()
  )
  returning id into new_bottle_id;

  insert into public.messages (bottle_id, author_id, body)
  values (new_bottle_id, uid, p_message);

  return new_bottle_id;
end;
$$;

grant execute on function public.drop_bottle(uuid, double precision, double precision, text, text, text, text) to authenticated;

-- Remove legacy 5-arg overload (PostgREST cannot resolve Shop RPC otherwise)
drop function if exists public.drop_bottle(uuid, double precision, double precision, text, text);

-- ── 007: shop bottle catalog ────────────────────────────────────────────────

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

-- ── 005: admin + 100k caps ──────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles p
set
  is_admin = true,
  bottle_caps = 100000
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('dreamernight@gmail.com');

notify pgrst, 'reload schema';
