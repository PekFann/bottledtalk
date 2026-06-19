-- Shop social features: signal towers, footprints, discovery, friends RPCs
-- Safe to re-run (idempotent tables/policies).

set search_path = public, extensions;

create extension if not exists pgcrypto with schema extensions;

alter table public.profiles
  add column if not exists bio text;

alter table public.messages
  add column if not exists is_remote boolean not null default false;

-- Tables
create table if not exists public.bottle_unlocks (
  bottle_id uuid not null references public.bottles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (bottle_id, user_id)
);

create table if not exists public.signal_towers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  location geography(point, 4326) not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists signal_towers_location_idx on public.signal_towers using gist (location);
create index if not exists signal_towers_expires_at_idx on public.signal_towers (expires_at);

create table if not exists public.footprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  location geography(point, 4326) not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists footprints_user_id_idx on public.footprints (user_id);
create index if not exists footprints_expires_at_idx on public.footprints (expires_at);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id)
);

create unique index if not exists friend_requests_pair_idx
  on public.friend_requests (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  );

-- Helpers
create or replace function public.can_read_bottle_messages(p_bottle_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bottles b
    where b.id = p_bottle_id
      and b.expires_at > now()
      and (
        not b.is_sealed
        or b.creator_id = p_user_id
        or exists (
          select 1 from public.bottle_unlocks bu
          where bu.bottle_id = b.id and bu.user_id = p_user_id
        )
      )
  );
$$;

create or replace function public.get_discovery_radius(
  lat double precision,
  lng double precision
)
returns double precision
language sql
stable
security definer
set search_path = public, extensions
as $$
  select case
    when exists (
      select 1 from public.signal_towers st
      where st.expires_at > now()
        and st_dwithin(
          st.location,
          st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
          1000
        )
    ) then 5000::double precision
    else 2000::double precision
  end;
$$;

drop function if exists public.nearby_bottles(double precision, double precision, double precision);

create or replace function public.nearby_bottles(
  lat double precision,
  lng double precision,
  radius_m double precision default null
)
returns table (
  id uuid,
  creator_id uuid,
  bottle_type_id uuid,
  lat double precision,
  lng double precision,
  title text,
  description text,
  is_sealed boolean,
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
  with effective_radius as (
    select coalesce(radius_m, public.get_discovery_radius(lat, lng)) as r
  )
  select
    b.id,
    b.creator_id,
    b.bottle_type_id,
    st_y(b.location::extensions.geometry) as lat,
    st_x(b.location::extensions.geometry) as lng,
    b.title,
    b.description,
    b.is_sealed,
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
  cross join effective_radius er
  where b.expires_at > now()
    and st_dwithin(
      b.location,
      st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
      er.r
    )
  order by b.created_at desc;
$$;

create or replace function public.nearby_signal_towers(
  lat double precision,
  lng double precision,
  radius_m double precision default null
)
returns table (
  id uuid,
  owner_id uuid,
  lat double precision,
  lng double precision,
  expires_at timestamptz,
  created_at timestamptz,
  owner_name text
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
    st.id,
    st.owner_id,
    st_y(st.location::extensions.geometry) as lat,
    st_x(st.location::extensions.geometry) as lng,
    st.expires_at,
    st.created_at,
    p.display_name as owner_name
  from public.signal_towers st
  join public.profiles p on p.id = st.owner_id
  cross join effective_radius er
  where st.expires_at > now()
    and st_dwithin(
      st.location,
      st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
      er.r
    )
  order by st.created_at desc;
$$;

create or replace function public.unlock_sealed_bottle(
  p_bottle_id uuid,
  p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  hash text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_pin is null or p_pin !~ '^\d{4}$' then
    raise exception 'PIN must be 4 digits';
  end if;

  select pin_hash into hash
  from public.bottles
  where id = p_bottle_id and is_sealed and expires_at > now();

  if hash is null then
    raise exception 'Bottle not found or not sealed';
  end if;

  if hash <> crypt(p_pin, hash) then
    raise exception 'Incorrect PIN';
  end if;

  insert into public.bottle_unlocks (bottle_id, user_id)
  values (p_bottle_id, uid)
  on conflict do nothing;

  return true;
end;
$$;

create or replace function public.place_signal_tower(
  p_lat double precision,
  p_lng double precision
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

create or replace function public.extend_signal_tower(
  p_tower_id uuid,
  p_days integer
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cost integer;
  balance integer;
  new_expires timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_days = 7 then
    cost := 35;
  elsif p_days = 30 then
    cost := 90;
  else
    raise exception 'Invalid extension period';
  end if;

  if not exists (
    select 1 from public.signal_towers
    where id = p_tower_id and owner_id = uid and expires_at > now()
  ) then
    raise exception 'Tower not found';
  end if;

  select bottle_caps into balance from public.profiles where id = uid for update;
  if balance < cost then
    raise exception 'Not enough bottle caps';
  end if;

  update public.profiles set bottle_caps = bottle_caps - cost where id = uid;

  update public.signal_towers
  set expires_at = greatest(expires_at, now()) + (p_days || ' days')::interval
  where id = p_tower_id
  returning expires_at into new_expires;

  return new_expires;
end;
$$;

create or replace function public.create_footprint(
  p_name text,
  p_lat double precision,
  p_lng double precision
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

create or replace function public.list_my_footprints()
returns table (
  id uuid,
  name text,
  lat double precision,
  lng double precision,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    f.id,
    f.name,
    st_y(f.location::extensions.geometry) as lat,
    st_x(f.location::extensions.geometry) as lng,
    f.expires_at,
    f.created_at
  from public.footprints f
  where f.user_id = auth.uid()
    and f.expires_at > now()
  order by f.created_at desc;
$$;

create or replace function public.post_message(
  p_bottle_id uuid,
  p_body text,
  p_footprint_id uuid default null,
  p_user_lat double precision default null,
  p_user_lng double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  b record;
  msg_id uuid;
  is_remote_flag boolean := false;
  dist_m double precision;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_body is null or trim(p_body) = '' then
    raise exception 'Message cannot be empty';
  end if;

  select b2.id, b2.creator_id, b2.is_sealed, b2.expires_at, b2.location
  into b
  from public.bottles b2
  where b2.id = p_bottle_id;

  if b.id is null or b.expires_at <= now() then
    raise exception 'Bottle not found or expired';
  end if;

  if b.is_sealed and b.creator_id <> uid then
    if not exists (
      select 1 from public.bottle_unlocks bu
      where bu.bottle_id = p_bottle_id and bu.user_id = uid
    ) then
      raise exception 'Unlock this sealed bottle first';
    end if;
  end if;

  if p_footprint_id is not null then
    if not exists (
      select 1 from public.footprints f
      where f.id = p_footprint_id and f.user_id = uid and f.expires_at > now()
    ) then
      raise exception 'Invalid footprint';
    end if;
    is_remote_flag := true;
  elsif p_user_lat is not null and p_user_lng is not null then
    dist_m := st_distance(
      b.location,
      st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326)::extensions.geography
    );
    if dist_m > 100 then
      is_remote_flag := true;
    end if;
  end if;

  insert into public.messages (bottle_id, author_id, body, is_remote)
  values (p_bottle_id, uid, trim(p_body), is_remote_flag)
  returning id into msg_id;

  return msg_id;
end;
$$;

create or replace function public.send_friend_request(p_recipient_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  existing record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_recipient_id = uid then
    raise exception 'Cannot friend yourself';
  end if;

  select * into existing
  from public.friend_requests fr
  where least(fr.requester_id, fr.recipient_id) = least(uid, p_recipient_id)
    and greatest(fr.requester_id, fr.recipient_id) = greatest(uid, p_recipient_id);

  if existing.id is not null then
    if existing.status = 'accepted' then
      raise exception 'Already friends';
    elsif existing.status = 'pending' then
      raise exception 'Friend request already pending';
    end if;
  end if;

  insert into public.friend_requests (requester_id, recipient_id, status)
  values (uid, p_recipient_id, 'pending')
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.respond_friend_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.friend_requests
  set
    status = case when p_accept then 'accepted' else 'declined' end,
    responded_at = now()
  where id = p_request_id
    and recipient_id = uid
    and status = 'pending';

  if not found then
    raise exception 'Request not found';
  end if;
end;
$$;

create or replace function public.list_friends()
returns table (
  friend_id uuid,
  display_name text,
  avatar_url text,
  bio text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when fr.requester_id = auth.uid() then fr.recipient_id
      else fr.requester_id
    end as friend_id,
    p.display_name,
    p.avatar_url,
    p.bio
  from public.friend_requests fr
  join public.profiles p on p.id = case
    when fr.requester_id = auth.uid() then fr.recipient_id
    else fr.requester_id
  end
  where fr.status = 'accepted'
    and (fr.requester_id = auth.uid() or fr.recipient_id = auth.uid());
$$;

-- RLS
alter table public.bottle_unlocks enable row level security;
drop policy if exists "Users can view own unlocks" on public.bottle_unlocks;
create policy "Users can view own unlocks"
  on public.bottle_unlocks for select to authenticated
  using (user_id = auth.uid());

alter table public.signal_towers enable row level security;
drop policy if exists "Towers viewable by authenticated" on public.signal_towers;
create policy "Towers viewable by authenticated"
  on public.signal_towers for select to authenticated using (true);

alter table public.footprints enable row level security;
drop policy if exists "Users can view own footprints" on public.footprints;
create policy "Users can view own footprints"
  on public.footprints for select to authenticated
  using (user_id = auth.uid());

alter table public.friend_requests enable row level security;
drop policy if exists "Users can view own friend requests" on public.friend_requests;
create policy "Users can view own friend requests"
  on public.friend_requests for select to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "Messages on non-expired bottles viewable" on public.messages;
drop policy if exists "Messages viewable with sealed access" on public.messages;
create policy "Messages viewable with sealed access"
  on public.messages for select
  to authenticated
  using (public.can_read_bottle_messages(bottle_id, auth.uid()));

drop policy if exists "Authenticated users can insert messages" on public.messages;

-- Grants
grant execute on function public.get_discovery_radius(double precision, double precision) to authenticated;
grant execute on function public.nearby_bottles(double precision, double precision, double precision) to authenticated;
grant execute on function public.nearby_signal_towers(double precision, double precision, double precision) to authenticated;
grant execute on function public.unlock_sealed_bottle(uuid, text) to authenticated;
grant execute on function public.place_signal_tower(double precision, double precision) to authenticated;
grant execute on function public.extend_signal_tower(uuid, integer) to authenticated;
grant execute on function public.create_footprint(text, double precision, double precision) to authenticated;
grant execute on function public.list_my_footprints() to authenticated;
grant execute on function public.post_message(uuid, text, uuid, double precision, double precision) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.list_friends() to authenticated;

notify pgrst, 'reload schema';
