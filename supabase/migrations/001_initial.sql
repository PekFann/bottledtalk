-- Enable PostGIS
create extension if not exists postgis with schema extensions;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Bottle types
create table public.bottle_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  duration_hours integer not null,
  icon text not null,
  marker_color text not null
);

insert into public.bottle_types (slug, name, description, duration_hours, icon, marker_color) values
  ('glass', 'Glass', 'Quick, ephemeral notes', 24, '🍾', '#60a5fa'),
  ('cork', 'Cork', 'Short conversations', 72, '🪵', '#34d399'),
  ('driftwood', 'Driftwood', 'Longer stories', 168, '🌊', '#fbbf24'),
  ('treasure', 'Treasure', 'Rare, long-lived bottles', 720, '💎', '#a78bfa');

-- Bottles
create table public.bottles (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  bottle_type_id uuid not null references public.bottle_types (id),
  location geography(point, 4326) not null,
  title text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index bottles_location_idx on public.bottles using gist (location);
create index bottles_expires_at_idx on public.bottles (expires_at);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  bottle_id uuid not null references public.bottles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_bottle_id_idx on public.messages (bottle_id);

-- Set expires_at from bottle type on insert
create or replace function public.set_bottle_expires_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hours integer;
begin
  select duration_hours into hours
  from public.bottle_types
  where id = new.bottle_type_id;

  new.expires_at := now() + (hours || ' hours')::interval;
  return new;
end;
$$;

create trigger bottles_set_expires_at
  before insert on public.bottles
  for each row
  execute function public.set_bottle_expires_at();

-- Nearby bottles RPC
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
set search_path = public
as $$
  select
    b.id,
    b.creator_id,
    b.bottle_type_id,
    st_y(b.location::geometry) as lat,
    st_x(b.location::geometry) as lng,
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
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_m
    )
  order by b.created_at desc;
$$;

-- Drop bottle with first message (atomic)
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
set search_path = public
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
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    p_title,
    now() -- trigger overwrites this
  )
  returning id into new_bottle_id;

  insert into public.messages (bottle_id, author_id, body)
  values (new_bottle_id, uid, p_message);

  return new_bottle_id;
end;
$$;

-- Cleanup expired bottles
create or replace function public.cleanup_expired_bottles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.bottles where expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Sailor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.bottle_types enable row level security;
alter table public.bottles enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bottle types policies
create policy "Bottle types are viewable by authenticated users"
  on public.bottle_types for select
  to authenticated
  using (true);

-- Bottles policies (map queries filter expired via nearby_bottles RPC)
create policy "Bottles viewable by authenticated users"
  on public.bottles for select
  to authenticated
  using (true);

create policy "Authenticated users can insert bottles"
  on public.bottles for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "Creators can delete own bottles"
  on public.bottles for delete
  to authenticated
  using (creator_id = auth.uid());

-- Messages policies
create policy "Messages on non-expired bottles viewable"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.bottles b
      where b.id = bottle_id and b.expires_at > now()
    )
  );

create policy "Authenticated users can insert messages"
  on public.messages for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bottles b
      where b.id = bottle_id and b.expires_at > now()
    )
  );

-- Realtime for messages
alter publication supabase_realtime add table public.messages;

-- Grant execute on functions
grant execute on function public.nearby_bottles(double precision, double precision, double precision) to authenticated;
grant execute on function public.drop_bottle(uuid, double precision, double precision, text, text) to authenticated;
grant execute on function public.cleanup_expired_bottles() to authenticated;
