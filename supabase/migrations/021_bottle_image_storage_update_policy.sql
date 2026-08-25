-- Patch storage UPDATE policy so pending → {bottle_id}/ rename is allowed
-- (needed if 020 was applied before the with-check fix).

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

notify pgrst, 'reload schema';
