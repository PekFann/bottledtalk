-- Profile picture background color and friends list avatar fields.

alter table public.profiles
  add column if not exists avatar_bg_color text not null default '#d4e8f7';

drop function if exists public.list_friends();

create or replace function public.list_friends()
returns table (
  friend_id uuid,
  display_name text,
  avatar_url text,
  avatar_bg_color text,
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
    p.avatar_bg_color,
    p.bio
  from public.friend_requests fr
  join public.profiles p on p.id = case
    when fr.requester_id = auth.uid() then fr.recipient_id
    else fr.requester_id
  end
  where fr.status = 'accepted'
    and (fr.requester_id = auth.uid() or fr.recipient_id = auth.uid())
  order by p.display_name;
$$;

grant execute on function public.list_friends() to authenticated;
