-- Bottle caps currency and collectible bag

alter table public.profiles
  add column if not exists bottle_caps integer not null default 100,
  add column if not exists bag_slot_limit integer not null default 10;

alter table public.bottle_types
  add column if not exists cap_cost integer not null default 10;

update public.bottle_types set cap_cost = 10 where slug = 'glass';
update public.bottle_types set cap_cost = 25 where slug = 'cork';
update public.bottle_types set cap_cost = 50 where slug = 'driftwood';
update public.bottle_types set cap_cost = 100 where slug = 'treasure';

-- Existing users without caps get starter balance
update public.profiles set bottle_caps = 100 where bottle_caps is null;

create table if not exists public.bag_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_bottle_id uuid references public.bottles (id) on delete set null,
  title text not null,
  type_slug text not null,
  type_name text not null,
  type_icon text not null,
  marker_color text not null,
  messages_snapshot jsonb not null default '[]'::jsonb,
  collected_at timestamptz not null default now(),
  collection_reason text not null check (collection_reason in ('manual', 'expired'))
);

create unique index if not exists bag_items_user_bottle_idx
  on public.bag_items (user_id, source_bottle_id)
  where source_bottle_id is not null;

create index if not exists bag_items_user_id_idx on public.bag_items (user_id);

-- Replace drop_bottle with cap deduction
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
  cost integer;
  balance integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select cap_cost into cost
  from public.bottle_types
  where id = p_bottle_type_id;

  if cost is null then
    raise exception 'Invalid bottle type';
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

-- Collect bottle into bag (snapshot conversation)
create or replace function public.collect_to_bag(
  p_bottle_id uuid,
  p_reason text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b record;
  slot_count integer;
  slot_limit integer;
  snapshot jsonb;
  new_item_id uuid;
  participated boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_reason not in ('manual', 'expired') then
    raise exception 'Invalid collection reason';
  end if;

  select b2.id, b2.title, b2.creator_id, b2.expires_at,
         bt.slug, bt.name, bt.icon, bt.marker_color
  into b
  from public.bottles b2
  join public.bottle_types bt on bt.id = b2.bottle_type_id
  where b2.id = p_bottle_id;

  if b.id is null then
    raise exception 'Bottle not found';
  end if;

  if p_reason = 'manual' and b.expires_at <= now() then
    raise exception 'Bottle has already washed away';
  end if;

  if p_reason = 'expired' and b.expires_at > now() then
    raise exception 'Bottle has not expired yet';
  end if;

  select exists (
    select 1 from public.messages m
    where m.bottle_id = p_bottle_id and m.author_id = uid
  ) or b.creator_id = uid
  into participated;

  if not participated then
    raise exception 'You did not participate in this conversation';
  end if;

  if exists (
    select 1 from public.bag_items bi
    where bi.user_id = uid and bi.source_bottle_id = p_bottle_id
  ) then
    raise exception 'Bottle already in your bag';
  end if;

  select count(*) into slot_count
  from public.bag_items
  where user_id = uid;

  select bag_slot_limit into slot_limit
  from public.profiles
  where id = uid;

  if slot_count >= slot_limit then
    raise exception 'Bag is full — trash a bottle to make space';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'author_name', p.display_name,
      'body', m.body,
      'created_at', m.created_at
    ) order by m.created_at
  ), '[]'::jsonb)
  into snapshot
  from public.messages m
  join public.profiles p on p.id = m.author_id
  where m.bottle_id = p_bottle_id;

  insert into public.bag_items (
    user_id, source_bottle_id, title,
    type_slug, type_name, type_icon, marker_color,
    messages_snapshot, collection_reason
  )
  values (
    uid, p_bottle_id, b.title,
    b.slug, b.name, b.icon, b.marker_color,
    snapshot, p_reason
  )
  returning id into new_item_id;

  return new_item_id;
end;
$$;

create or replace function public.trash_from_bag(p_bag_item_id uuid)
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

  delete from public.bag_items
  where id = p_bag_item_id and user_id = uid;

  if not found then
    raise exception 'Bag item not found';
  end if;
end;
$$;

create or replace function public.get_washed_ashore()
returns table (
  id uuid,
  title text,
  expires_at timestamptz,
  type_slug text,
  type_name text,
  type_icon text,
  marker_color text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.title,
    b.expires_at,
    bt.slug,
    bt.name,
    bt.icon,
    bt.marker_color
  from public.bottles b
  join public.bottle_types bt on bt.id = b.bottle_type_id
  where b.expires_at <= now()
    and (
      b.creator_id = auth.uid()
      or exists (
        select 1 from public.messages m
        where m.bottle_id = b.id and m.author_id = auth.uid()
      )
    )
    and not exists (
      select 1 from public.bag_items bi
      where bi.user_id = auth.uid() and bi.source_bottle_id = b.id
    )
  order by b.expires_at desc;
$$;

-- RLS for bag_items
alter table public.bag_items enable row level security;

create policy "Users can view own bag items"
  on public.bag_items for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own bag items"
  on public.bag_items for delete
  to authenticated
  using (user_id = auth.uid());

grant execute on function public.collect_to_bag(uuid, text) to authenticated;
grant execute on function public.trash_from_bag(uuid) to authenticated;
grant execute on function public.get_washed_ashore() to authenticated;
