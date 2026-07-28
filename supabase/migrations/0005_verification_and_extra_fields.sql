-- Adds fields for identity verification, spoken languages, and horoscope chart upload.

alter table public.profiles
  add column if not exists languages_known text,
  add column if not exists horoscope_chart_path text,
  add column if not exists id_document_type text check (id_document_type in ('aadhaar', 'pan', 'passport', 'driving_license')),
  add column if not exists id_document_path text;

-- Identity documents are far more sensitive than profile photos, so this bucket is
-- private (no public read policy) — only the owner and staff can access files, and
-- only via signed URLs.
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do nothing;

create policy "users upload their own id documents" on storage.objects
  for insert with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users read their own id documents" on storage.objects
  for select using (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "staff read all id documents" on storage.objects
  for select using (
    bucket_id = 'identity-documents' and public.is_staff()
  );
