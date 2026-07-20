-- Fix cap spawn density (5-10 per anchor location), purge stale days, and fix pickup.

-- Replace ensure function: one spawn pool per anchor location key, not per grid cell.
create or replace function public.ensure_cap_spawns_for_grid(
  p_grid_key text,
  p_center_lat double precision,
  p_center_lng double precision,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  existing_count integer;
  spawn_count integer;
  i smallint;
  angle double precision;
  dist double precision;
  spawn_lat double precision;
  spawn_lng double precision;
  max_offset constant double precision := 0.005;
begin
  select count(*)::integer into existing_count
  from public.map_cap_spawns
  where grid_key = p_grid_key and spawn_date = p_date;

  if existing_count > 0 then
    return;
  end if;

  -- 5-10 caps per location (was 5-15)
  spawn_count := 5 + (abs(hashtext(p_grid_key || p_date::text)) % 6);

  for i in 0..(spawn_count - 1) loop
    -- Polar offset within ~500m of anchor
    angle := (abs(hashtext(p_grid_key || p_date::text || i::text || 'a')) % 3600)::double precision / 3600.0 * 2.0 * 3.14159265;
    dist := (abs(hashtext(p_grid_key || p_date::text || i::text || 'd')) % 1000)::double precision / 1000.0 * max_offset;
    spawn_lat := p_center_lat + dist * cos(angle);
    spawn_lng := p_center_lng + dist * sin(angle);

    insert into public.map_cap_spawns (grid_key, spawn_date, spawn_index, location)
    values (
      p_grid_key,
      p_date,
      i,
      st_setsrid(st_makepoint(spawn_lng, spawn_lat), 4326)::extensions.geography
    )
    on conflict (grid_key, spawn_date, spawn_index) do nothing;
  end loop;
end;
$$;

-- Replace nearby function: single anchor pool, purge old rows.
create or replace function public.nearby_map_cap_spawns(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default null
)
returns table (
  id uuid,
  lat double precision,
  lng double precision
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  effective_radius double precision;
  today date := (now() at time zone 'utc')::date;
  location_key text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Purge stale spawns (cascades to cap_spawn_collections via FK)
  delete from public.map_cap_spawns
  where spawn_date < today;

  effective_radius := coalesce(p_radius_m, public.get_discovery_radius(p_lat, p_lng));
  location_key := public.cap_grid_key(p_lat, p_lng);

  -- Ensure one pool of 5-10 caps for this anchor location today
  perform public.ensure_cap_spawns_for_grid(location_key, p_lat, p_lng, today);

  return query
  select
    s.id,
    st_y(s.location::extensions.geometry) as lat,
    st_x(s.location::extensions.geometry) as lng
  from public.map_cap_spawns s
  where s.spawn_date = today
    and s.grid_key = location_key
    and st_dwithin(
      s.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      effective_radius
    )
    and not exists (
      select 1 from public.cap_spawn_collections c
      where c.spawn_id = s.id and c.user_id = uid
    )
  order by s.spawn_index;
end;
$$;

-- Replace collect function: remove 50m GPS check, validate via anchor radius instead.
drop function if exists public.collect_map_cap_spawn(uuid, double precision, double precision, boolean);

create or replace function public.collect_map_cap_spawn(
  p_spawn_id uuid,
  p_anchor_lat double precision,
  p_anchor_lng double precision,
  p_radius_m double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  spawn_rec record;
  new_balance integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select s.id, s.spawn_date, s.location
  into spawn_rec
  from public.map_cap_spawns s
  where s.id = p_spawn_id;

  if spawn_rec.id is null then
    raise exception 'Cap spawn not found';
  end if;

  if spawn_rec.spawn_date <> (now() at time zone 'utc')::date then
    raise exception 'This cap has expired';
  end if;

  if exists (
    select 1 from public.cap_spawn_collections c
    where c.spawn_id = p_spawn_id and c.user_id = uid
  ) then
    raise exception 'Already collected';
  end if;

  -- Verify spawn is within anchor discovery radius (anti-cheat)
  if not st_dwithin(
    spawn_rec.location,
    st_setsrid(st_makepoint(p_anchor_lng, p_anchor_lat), 4326)::extensions.geography,
    p_radius_m
  ) then
    raise exception 'Cap is outside your discovery area';
  end if;

  insert into public.cap_spawn_collections (user_id, spawn_id)
  values (uid, p_spawn_id);

  update public.profiles
  set bottle_caps = bottle_caps + 1
  where id = uid
  returning bottle_caps into new_balance;

  return jsonb_build_object('new_balance', new_balance);
end;
$$;

grant execute on function public.collect_map_cap_spawn(uuid, double precision, double precision, double precision) to authenticated;

notify pgrst, 'reload schema';
