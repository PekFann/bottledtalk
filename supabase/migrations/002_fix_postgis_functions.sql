-- Run this if 001_initial.sql failed at nearby_bottles due to "type geometry does not exist"
-- PostGIS on Supabase installs into the extensions schema.

create extension if not exists postgis with schema extensions;

create or replace function public.nearby_bottles(
  lat double precision,
  lng double precision,
  radius_m double precision default 2000
)
returns table (
  id uuid,
  creator_id uuid,
  bottle_type_id uuid,
  lat double precision,
  lng double precision,
  title text,
  expires_at timestamptz,
  created_at timestamptz,
  type_slug text,
  type_name text,
  type_icon text,
  marker_color text,
  creator_name text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    b.id,
    b.creator_id,
    b.bottle_type_id,
    st_y(b.location::extensions.geometry) as lat,
    st_x(b.location::extensions.geometry) as lng,
    b.title,
    b.expires_at,
    b.created_at,
    bt.slug as type_slug,
    bt.name as type_name,
    bt.icon as type_icon,
    bt.marker_color,
    p.display_name as creator_name
  from public.bottles b
  join public.bottle_types bt on bt.id = b.bottle_type_id
  join public.profiles p on p.id = b.creator_id
  where b.expires_at > now()
    and st_dwithin(
      b.location,
      st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
      radius_m
    )
  order by b.created_at desc;
$$;

create or replace function public.drop_bottle(
  p_bottle_type_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_title text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_bottle_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.bottles (creator_id, bottle_type_id, location, title, expires_at)
  values (
    uid,
    p_bottle_type_id,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    p_title,
    now()
  )
  returning id into new_bottle_id;

  insert into public.messages (bottle_id, author_id, body)
  values (new_bottle_id, uid, p_message);

  return new_bottle_id;
end;
$$;

grant execute on function public.nearby_bottles(double precision, double precision, double precision) to authenticated;
grant execute on function public.drop_bottle(uuid, double precision, double precision, text, text) to authenticated;
