-- Patch: Shop calls drop_bottle with sealed-bottle params (migration 004).
-- Safe to run if 004 was only partially applied.

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

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
