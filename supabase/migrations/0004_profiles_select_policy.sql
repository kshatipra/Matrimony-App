-- The original "profiles are readable by signed-in users" policy let any
-- authenticated user read ANY profile row, including pending/rejected ones
-- that haven't cleared moderation. Restrict browsing to approved profiles,
-- while still letting a user see their own profile (any status) and staff
-- see everything (via the existing "admins manage all profiles" policy).

drop policy if exists "profiles are readable by signed-in users" on public.profiles;

create policy "approved profiles are readable, plus your own" on public.profiles
  for select using (
    verification_status = 'approved' or id = auth.uid()
  );
