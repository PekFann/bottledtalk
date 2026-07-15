-- Daily map bottle cap collectibles: 5-15 per ~1 km grid cell per UTC day.

create table if not exists public.map_cap_spawns (
  id uuid primary key default gen_random_uuid(),
  grid_key text not null,
  spawn_date date not null,
  spawn_index smallint not null check (spawn_index >= 0),
  location extensions.geography not null,
  created_at timestamptz not null default now(),
  unique (grid_key, spawn_date, spawn_index)
);

create index if not exists map_cap_spawns_date_grid_idx
  on public.map_cap_spawns (spawn_date, grid_key);

create index if not exists map_cap_spawns_location_idx
  on public.map_cap_spawns using gist (location);

create table if not exists public.cap_spawn_collections (
  user_id uuid not null references public.profiles (id) on delete cascade,
  spawn_id uuid not null references public.map_cap_spawns (id) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, spawn_id)
);

create index if not exists cap_spawn_collections_spawn_id_idx
  on public.cap_spawn_collections (spawn_id);

alter table public.map_cap_spawns enable row level security;
alter table public.cap_spawn_collections enable row level security;

drop policy if exists "Authenticated users can view cap spawns" on public.map_cap_spawns;
create policy "Authenticated users can view cap spawns"
  on public.map_cap_spawns for select to authenticated
  using (spawn_date = (now() at time zone 'utc')::date);

drop policy if exists "Users can view own cap collections" on public.cap_spawn_collections;
create policy "Users can view own cap collections"
  on public.cap_spawn_collections for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own cap collections" on public.cap_spawn_collections;
create policy "Users can insert own cap collections"
  on public.cap_spawn_collections for insert to authenticated
  with check (user_id = auth.uid());

-- Grid key: ~1.1 km cells at mid-latitudes.
create or replace function public.cap_grid_key(p_lat double precision, p_lng double precision)
returns text
language sql
immutable
as $$
  select round(p_lat::numeric, 2)::text || '_' || round(p_lng::numeric, 2)::text;
$$;

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
  offset_lat double precision;
  offset_lng double precision;
  spawn_lat double precision;
  spawn_lng double precision;
  cell_size constant double precision := 0.01;
begin
  select count(*)::integer into existing_count
  from public.map_cap_spawns
  where grid_key = p_grid_key and spawn_date = p_date;

  if existing_count > 0 then
    return;
  end if;

  spawn_count := 5 + (abs(hashtext(p_grid_key || p_date::text)) % 11);

  for i in 0..(spawn_count - 1) loop
    offset_lat := ((abs(hashtext(p_grid_key || p_date::text || i::text || 'lat')) % 1000)::double precision / 1000.0 - 0.5) * cell_size;
    offset_lng := ((abs(hashtext(p_grid_key || p_date::text || i::text || 'lng')) % 1000)::double precision / 1000.0 - 0.5) * cell_size;
    spawn_lat := p_center_lat + offset_lat;
    spawn_lng := p_center_lng + offset_lng;

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
  grid_lat double precision;
  grid_lng double precision;
  grid_key text;
  lat_min double precision;
  lat_max double precision;
  lng_min double precision;
  lng_max double precision;
  cell_size constant double precision := 0.01;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  effective_radius := coalesce(p_radius_m, public.get_discovery_radius(p_lat, p_lng));

  lat_min := p_lat - (effective_radius / 111000.0);
  lat_max := p_lat + (effective_radius / 111000.0);
  lng_min := p_lng - (effective_radius / (111000.0 * greatest(cos(radians(p_lat)), 0.1)));
  lng_max := p_lng + (effective_radius / (111000.0 * greatest(cos(radians(p_lat)), 0.1)));

  grid_lat := floor(lat_min / cell_size) * cell_size;
  while grid_lat <= lat_max loop
    grid_lng := floor(lng_min / cell_size) * cell_size;
    while grid_lng <= lng_max loop
      grid_key := public.cap_grid_key(grid_lat, grid_lng);
      perform public.ensure_cap_spawns_for_grid(grid_key, grid_lat, grid_lng, today);
      grid_lng := grid_lng + cell_size;
    end loop;
    grid_lat := grid_lat + cell_size;
  end loop;

  return query
  select
    s.id,
    st_y(s.location::extensions.geometry) as lat,
    st_x(s.location::extensions.geometry) as lng
  from public.map_cap_spawns s
  where s.spawn_date = today
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

create or replace function public.collect_map_cap_spawn(
  p_spawn_id uuid,
  p_user_lat double precision,
  p_user_lng double precision,
  p_footprint_mode boolean default false
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
  collect_radius constant double precision := 50;
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

  if not p_footprint_mode then
    if not st_dwithin(
      spawn_rec.location,
      st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326)::extensions.geography,
      collect_radius
    ) then
      raise exception 'Too far away to collect';
    end if;
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

grant execute on function public.cap_grid_key(double precision, double precision) to authenticated;
grant execute on function public.ensure_cap_spawns_for_grid(text, double precision, double precision, date) to authenticated;
grant execute on function public.nearby_map_cap_spawns(double precision, double precision, double precision) to authenticated;
grant execute on function public.collect_map_cap_spawn(uuid, double precision, double precision, boolean) to authenticated;

notify pgrst, 'reload schema';
