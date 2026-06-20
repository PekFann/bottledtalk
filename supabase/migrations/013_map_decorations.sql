-- Map decorations, placement radius validation, and updated place RPCs.

create or replace function public.assert_placement_in_radius(
  p_lat double precision,
  p_lng double precision,
  p_anchor_lat double precision,
  p_anchor_lng double precision,
  p_radius_m double precision
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not st_dwithin(
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    st_setsrid(st_makepoint(p_anchor_lng, p_anchor_lat), 4326)::extensions.geography,
    p_radius_m
  ) then
    raise exception 'Placement must be within your viewable circle';
  end if;
end;
$$;

-- Decorations table
create table if not exists public.map_decorations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  location extensions.geography not null,
  title text not null check (char_length(trim(title)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists map_decorations_expires_at_idx
  on public.map_decorations (expires_at);

create index if not exists map_decorations_creator_id_idx
  on public.map_decorations (creator_id);

alter table public.map_decorations enable row level security;

drop policy if exists "Authenticated users can view active decorations" on public.map_decorations;
create policy "Authenticated users can view active decorations"
  on public.map_decorations for select to authenticated
  using (expires_at > now());

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

create or replace function public.place_decoration(
  p_title text,
  p_description text,
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

  perform public.assert_placement_in_radius(
    p_lat, p_lng, p_anchor_lat, p_anchor_lng, p_radius_m
  );

  select bottle_caps into balance from public.profiles where id = uid for update;
  if balance < decoration_cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles set bottle_caps = bottle_caps - decoration_cost where id = uid;

  insert into public.map_decorations (creator_id, location, title, description, expires_at)
  values (
    uid,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    trim(p_title),
    trim(p_description),
    now() + interval '30 days'
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- drop_bottle with placement radius validation
drop function if exists public.drop_bottle(uuid, double precision, double precision, text, text, text, text);

create or replace function public.drop_bottle(
  p_bottle_type_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_title text,
  p_message text,
  p_description text default null,
  p_pin text default null,
  p_anchor_lat double precision default null,
  p_anchor_lng double precision default null,
  p_radius_m double precision default null
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

  if p_anchor_lat is not null and p_anchor_lng is not null and p_radius_m is not null then
    perform public.assert_placement_in_radius(
      p_lat, p_lng, p_anchor_lat, p_anchor_lng, p_radius_m
    );
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

-- place_signal_tower with placement radius validation
drop function if exists public.place_signal_tower(double precision, double precision);

create or replace function public.place_signal_tower(
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
  tower_cost constant integer := 1000;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_placement_in_radius(
    p_lat, p_lng, p_anchor_lat, p_anchor_lng, p_radius_m
  );

  select bottle_caps into balance from public.profiles where id = uid for update;
  if balance < tower_cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles set bottle_caps = bottle_caps - tower_cost where id = uid;

  insert into public.signal_towers (owner_id, location, expires_at)
  values (
    uid,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    now() + interval '90 days'
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- create_footprint with placement radius validation
drop function if exists public.create_footprint(text, double precision, double precision);

create or replace function public.create_footprint(
  p_name text,
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
  footprint_cost constant integer := 100;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Footprint name is required';
  end if;

  perform public.assert_placement_in_radius(
    p_lat, p_lng, p_anchor_lat, p_anchor_lng, p_radius_m
  );

  select bottle_caps into balance from public.profiles where id = uid for update;
  if balance < footprint_cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles set bottle_caps = bottle_caps - footprint_cost where id = uid;

  insert into public.footprints (user_id, name, location, expires_at)
  values (
    uid,
    trim(p_name),
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    now() + interval '30 days'
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.assert_placement_in_radius(double precision, double precision, double precision, double precision, double precision) to authenticated;
grant execute on function public.nearby_decorations(double precision, double precision, double precision) to authenticated;
grant execute on function public.place_decoration(text, text, double precision, double precision, double precision, double precision, double precision) to authenticated;
grant execute on function public.drop_bottle(uuid, double precision, double precision, text, text, text, text, double precision, double precision, double precision) to authenticated;
grant execute on function public.place_signal_tower(double precision, double precision, double precision, double precision, double precision) to authenticated;
grant execute on function public.create_footprint(text, double precision, double precision, double precision, double precision, double precision) to authenticated;

notify pgrst, 'reload schema';
