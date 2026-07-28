-- Storage bucket for profile photos, plus RLS-equivalent storage policies.
-- Path convention: <profile_id>/<filename>, so ownership is derivable from the path.

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile photos are publicly readable" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "users upload their own profile photos" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage their own profile photo files" on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own profile photo files" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
