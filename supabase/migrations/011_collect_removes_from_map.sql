-- When a user keeps a live bottle in their bag, remove it from the map immediately.

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

  if p_reason = 'manual' then
    update public.bottles
    set expires_at = now()
    where id = p_bottle_id;
  end if;

  return new_item_id;
end;
$$;

grant execute on function public.collect_to_bag(uuid, text) to authenticated;
