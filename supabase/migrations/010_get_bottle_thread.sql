-- Single RPC for bottle thread page (replaces 4+ round trips)

set search_path = public;

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

grant execute on function public.get_bottle_thread(uuid) to authenticated;

notify pgrst, 'reload schema';
