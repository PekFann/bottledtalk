-- Add decoration_type to map decorations and update RPCs.

alter table public.map_decorations
  add column if not exists decoration_type text not null default 'flower';

drop function if exists public.nearby_decorations(double precision, double precision, double precision);

create or replace function public.nearby_decorations(
  lat double precision,
  lng double precision,
  radius_m double precision default null
)
returns table (
  id uuid,
  creator_id uuid,
  lat double precision,
  lng double precision,
  title text,
  description text,
  decoration_type text,
  expires_at timestamptz,
  created_at timestamptz,
  creator_name text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with effective_radius as (
    select coalesce(radius_m, public.get_discovery_radius(lat, lng)) as r
  )
  select
    d.id,
    d.creator_id,
    st_y(d.location::extensions.geometry) as lat,
    st_x(d.location::extensions.geometry) as lng,
    d.title,
    d.description,
    d.decoration_type,
    d.expires_at,
    d.created_at,
    p.display_name as creator_name
  from public.map_decorations d
  join public.profiles p on p.id = d.creator_id
  cross join effective_radius er
  where d.expires_at > now()
    and st_dwithin(
      d.location,
      st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
      er.r
    )
  order by d.created_at desc;
$$;

drop function if exists public.place_decoration(text, text, double precision, double precision, double precision, double precision, double precision);

create or replace function public.place_decoration(
  p_title text,
  p_description text,
  p_decoration_type text,
  p_lat double precision,
  p_lng double precision,
  p_anchor_lat double precision,
  p_anchor_lng double precision,
  p_radius_m double precision
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  balance integer;
  decoration_cost constant integer := 50;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_title is null or trim(p_title) = '' then
    raise exception 'Title is required';
  end if;

  if p_description is null or trim(p_description) = '' then
    raise exception 'Description is required';
  end if;

  if p_decoration_type is null or trim(p_decoration_type) = '' then
    raise exception 'Decoration type is required';
  end if;

  perform public.assert_placement_in_radius(
    p_lat, p_lng, p_anchor_lat, p_anchor_lng, p_radius_m
  );

  select bottle_caps into balance from public.profiles where id = uid for update;
  if balance < decoration_cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles set bottle_caps = bottle_caps - decoration_cost where id = uid;

  insert into public.map_decorations (creator_id, location, title, description, decoration_type, expires_at)
  values (
    uid,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    trim(p_title),
    trim(p_description),
    trim(p_decoration_type),
    now() + interval '30 days'
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.nearby_decorations(double precision, double precision, double precision) to authenticated;
grant execute on function public.place_decoration(text, text, text, double precision, double precision, double precision, double precision, double precision) to authenticated;
