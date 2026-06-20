-- Permanently stop washed-ashore prompts for trashed or dismissed bottles.

create table if not exists public.bottle_dismissals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  bottle_id uuid not null references public.bottles (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, bottle_id)
);

create index if not exists bottle_dismissals_user_id_idx
  on public.bottle_dismissals (user_id);

alter table public.bottle_dismissals enable row level security;

drop policy if exists "Users can view own bottle dismissals" on public.bottle_dismissals;
create policy "Users can view own bottle dismissals"
  on public.bottle_dismissals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own bottle dismissals" on public.bottle_dismissals;
create policy "Users can insert own bottle dismissals"
  on public.bottle_dismissals for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.dismiss_washed_ashore(p_bottle_id uuid)
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

  if not exists (select 1 from public.bottles where id = p_bottle_id) then
    raise exception 'Bottle not found';
  end if;

  insert into public.bottle_dismissals (user_id, bottle_id)
  values (uid, p_bottle_id)
  on conflict do nothing;
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
  src_bottle uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select source_bottle_id into src_bottle
  from public.bag_items
  where id = p_bag_item_id and user_id = uid;

  delete from public.bag_items
  where id = p_bag_item_id and user_id = uid;

  if not found then
    raise exception 'Bag item not found';
  end if;

  if src_bottle is not null then
    insert into public.bottle_dismissals (user_id, bottle_id)
    values (uid, src_bottle)
    on conflict do nothing;
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
    and not exists (
      select 1 from public.bottle_dismissals bd
      where bd.user_id = auth.uid() and bd.bottle_id = b.id
    )
  order by b.expires_at desc;
$$;

grant execute on function public.dismiss_washed_ashore(uuid) to authenticated;
grant execute on function public.trash_from_bag(uuid) to authenticated;
grant execute on function public.get_washed_ashore() to authenticated;
