-- Bottle cast photos: messages.image_path + public bottle-images bucket + cleanup.

alter table public.messages
  add column if not exists image_path text;

-- Public bucket for bottle letter photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bottle-images',
  'bottle-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Bottle images public read" on storage.objects;
create policy "Bottle images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'bottle-images');

drop policy if exists "Users upload pending bottle images" on storage.objects;
create policy "Users upload pending bottle images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bottle-images'
    and (storage.foldername(name))[1] = 'pending'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users update own pending bottle images" on storage.objects;
create policy "Users update own pending bottle images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and (storage.foldername(name))[1] = 'pending'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'bottle-images'
    and (
      (
        (storage.foldername(name))[1] = 'pending'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    )
  );

drop policy if exists "Users delete own pending bottle images" on storage.objects;
create policy "Users delete own pending bottle images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and (storage.foldername(name))[1] = 'pending'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Delete storage objects by path (security definer for cleanup RPCs)
create or replace function public.delete_bottle_image_paths(p_paths text[])
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if p_paths is null or array_length(p_paths, 1) is null then
    return;
  end if;

  delete from storage.objects
  where bucket_id = 'bottle-images'
    and name = any (p_paths);
end;
$$;

create or replace function public.delete_bottle_images_for_bottle(p_bottle_id uuid)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'bottle-images'
    and (
      name like (p_bottle_id::text || '/%')
      or name in (
        select m.image_path
        from public.messages m
        where m.bottle_id = p_bottle_id
          and m.image_path is not null
      )
    );
end;
$$;

-- drop_bottle with optional image
drop function if exists public.drop_bottle(
  uuid, double precision, double precision, text, text, text, text,
  double precision, double precision, double precision
);

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
  p_radius_m double precision default null,
  p_image_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, storage
as $$
declare
  new_bottle_id uuid;
  uid uuid := auth.uid();
  cost integer;
  balance integer;
  type_rec record;
  pending_path text;
  final_path text;
  file_name text;
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

  pending_path := nullif(trim(p_image_path), '');
  if pending_path is not null then
    if pending_path !~ ('^pending/' || uid::text || '/[^/]+$') then
      raise exception 'Invalid image path';
    end if;
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'bottle-images' and name = pending_path
    ) then
      raise exception 'Image not found';
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

  final_path := null;
  if pending_path is not null then
    file_name := split_part(pending_path, '/', 3);
    final_path := new_bottle_id::text || '/' || file_name;

    update storage.objects
    set name = final_path
    where bucket_id = 'bottle-images'
      and name = pending_path;
  end if;

  insert into public.messages (bottle_id, author_id, body, image_path)
  values (new_bottle_id, uid, p_message, final_path);

  return new_bottle_id;
end;
$$;

-- get_bottle_thread includes image_path
create or replace function public.get_bottle_thread(p_bottle_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b record;
  is_creator boolean;
  is_unlocked boolean;
  msgs json;
  in_bag boolean;
  has_replied boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select
    b2.id,
    b2.creator_id,
    b2.title,
    b2.description,
    b2.is_sealed,
    b2.expires_at,
    b2.created_at,
    bt.id as type_id,
    bt.slug as type_slug,
    bt.name as type_name,
    bt.description as type_description,
    bt.duration_hours,
    bt.icon as type_icon,
    bt.marker_color,
    bt.is_sealed as type_is_sealed,
    p.id as creator_profile_id,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar_url,
    p.created_at as creator_created_at
  into b
  from public.bottles b2
  join public.bottle_types bt on bt.id = b2.bottle_type_id
  join public.profiles p on p.id = b2.creator_id
  where b2.id = p_bottle_id;

  if b.id is null then
    return null;
  end if;

  is_creator := b.creator_id = uid;
  is_unlocked := is_creator
    or not coalesce(b.is_sealed, false)
    or exists (
      select 1 from public.bottle_unlocks bu
      where bu.bottle_id = p_bottle_id and bu.user_id = uid
    );

  if is_unlocked then
    select coalesce(
      json_agg(
        json_build_object(
          'id', m.id,
          'bottle_id', m.bottle_id,
          'author_id', m.author_id,
          'body', m.body,
          'created_at', m.created_at,
          'is_remote', m.is_remote,
          'image_path', m.image_path,
          'author', json_build_object(
            'id', ap.id,
            'display_name', ap.display_name,
            'avatar_url', ap.avatar_url,
            'created_at', ap.created_at
          )
        )
        order by m.created_at asc
      ),
      '[]'::json
    )
    into msgs
    from public.messages m
    join public.profiles ap on ap.id = m.author_id
    where m.bottle_id = p_bottle_id;
  else
    msgs := '[]'::json;
  end if;

  select exists (
    select 1 from public.bag_items bi
    where bi.user_id = uid and bi.source_bottle_id = p_bottle_id
  ) into in_bag;

  select exists (
    select 1 from public.messages m2
    where m2.bottle_id = p_bottle_id and m2.author_id = uid
  ) into has_replied;

  return json_build_object(
    'bottle', json_build_object(
      'id', b.id,
      'creator_id', b.creator_id,
      'title', b.title,
      'description', b.description,
      'is_sealed', b.is_sealed,
      'expires_at', b.expires_at,
      'created_at', b.created_at
    ),
    'bottle_type', json_build_object(
      'id', b.type_id,
      'slug', b.type_slug,
      'name', b.type_name,
      'description', b.type_description,
      'duration_hours', b.duration_hours,
      'icon', b.type_icon,
      'marker_color', b.marker_color,
      'is_sealed', b.type_is_sealed
    ),
    'creator', json_build_object(
      'id', b.creator_profile_id,
      'display_name', b.creator_name,
      'avatar_url', b.creator_avatar_url,
      'created_at', b.creator_created_at
    ),
    'is_creator', is_creator,
    'is_unlocked', is_unlocked,
    'messages', msgs,
    'already_in_bag', in_bag,
    'participated', is_creator or has_replied
  );
end;
$$;

-- collect_to_bag includes image_path in snapshot
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
      'created_at', m.created_at,
      'image_path', m.image_path
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

-- cleanup: delete images then bottles
create or replace function public.cleanup_expired_bottles()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer;
  expired_ids uuid[];
  paths text[];
begin
  select coalesce(array_agg(id), '{}'::uuid[])
  into expired_ids
  from public.bottles
  where expires_at <= now();

  if array_length(expired_ids, 1) is null then
    return 0;
  end if;

  select coalesce(array_agg(distinct m.image_path), '{}'::text[])
  into paths
  from public.messages m
  where m.bottle_id = any (expired_ids)
    and m.image_path is not null;

  -- Skip paths still referenced by bag snapshots
  select coalesce(array_agg(p), '{}'::text[])
  into paths
  from unnest(paths) as p
  where not exists (
    select 1
    from public.bag_items bi,
         jsonb_array_elements(bi.messages_snapshot) as elem
    where elem->>'image_path' = p
  );

  perform public.delete_bottle_image_paths(paths);

  -- Also remove any leftover folder objects for bottles with no bag refs
  delete from storage.objects
  where bucket_id = 'bottle-images'
    and exists (
      select 1 from unnest(expired_ids) as eid
      where name like (eid::text || '/%')
        and not exists (
          select 1
          from public.bag_items bi,
               jsonb_array_elements(bi.messages_snapshot) as elem
          where elem->>'image_path' = name
        )
    );

  delete from public.bottles where id = any (expired_ids);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- trash_from_bag: delete orphaned images from snapshot
create or replace function public.trash_from_bag(p_bag_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  uid uuid := auth.uid();
  src_bottle uuid;
  snapshot jsonb;
  paths text[];
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select source_bottle_id, messages_snapshot
  into src_bottle, snapshot
  from public.bag_items
  where id = p_bag_item_id and user_id = uid;

  if not found then
    raise exception 'Bag item not found';
  end if;

  select coalesce(array_agg(distinct elem->>'image_path'), '{}'::text[])
  into paths
  from jsonb_array_elements(coalesce(snapshot, '[]'::jsonb)) as elem
  where elem->>'image_path' is not null
    and elem->>'image_path' <> '';

  delete from public.bag_items
  where id = p_bag_item_id and user_id = uid;

  if src_bottle is not null then
    insert into public.bottle_dismissals (user_id, bottle_id)
    values (uid, src_bottle)
    on conflict do nothing;
  end if;

  -- Delete images no longer referenced by any bag or live message
  select coalesce(array_agg(p), '{}'::text[])
  into paths
  from unnest(paths) as p
  where not exists (
    select 1
    from public.bag_items bi,
         jsonb_array_elements(bi.messages_snapshot) as elem
    where elem->>'image_path' = p
  )
  and not exists (
    select 1 from public.messages m
    where m.image_path = p
  );

  perform public.delete_bottle_image_paths(paths);
end;
$$;

grant execute on function public.drop_bottle(
  uuid, double precision, double precision, text, text, text, text,
  double precision, double precision, double precision, text
) to authenticated;
grant execute on function public.delete_bottle_image_paths(text[]) to authenticated;
grant execute on function public.delete_bottle_images_for_bottle(uuid) to authenticated;

notify pgrst, 'reload schema';
