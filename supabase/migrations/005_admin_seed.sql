-- Admin flag and seed account

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles p
set
  is_admin = true,
  bottle_caps = 100000
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('dreamernight@gmail.com');
