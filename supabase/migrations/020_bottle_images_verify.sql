-- Verify bottle image setup (run in Supabase SQL Editor after 020).
-- Expect: bucket_ok=true, column_ok=true, drop_bottle_has_image_param=true

select
  exists (
    select 1 from storage.buckets where id = 'bottle-images' and public = true
  ) as bucket_ok,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'image_path'
  ) as column_ok,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'drop_bottle'
      and pg_get_function_identity_arguments(p.oid) like '%p_image_path%'
  ) as drop_bottle_has_image_param;
