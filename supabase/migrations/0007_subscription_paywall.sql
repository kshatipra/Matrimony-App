-- Paywall model: account creation and profile editing are free. Viewing other
-- members' profiles/photos, being visible to others, and sending interests all
-- require an active paid subscription on BOTH sides (viewer and the profile
-- being viewed) — an unpaid profile simply never appears to anyone.

alter table public.subscriptions
  rename column stripe_customer_id to razorpay_customer_id;
alter table public.subscriptions
  rename column stripe_subscription_id to razorpay_subscription_id;

-- SECURITY DEFINER so a policy on profiles/photos can check ANOTHER user's
-- subscription without needing a select policy that exposes it directly.
create or replace function public.has_active_subscription(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = check_user_id
      and s.status = 'active'
      and s.plan = 'paid'
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

drop policy if exists "approved profiles are readable, plus your own" on public.profiles;

create policy "approved profiles are readable by subscribed members" on public.profiles
  for select using (
    id = auth.uid()
    or (
      verification_status = 'approved'
      and public.has_active_subscription(auth.uid())
      and public.has_active_subscription(id)
    )
  );

drop policy if exists "approved photos are readable" on public.photos;

create policy "approved photos are readable by subscribed members" on public.photos
  for select using (
    profile_id = auth.uid()
    or (
      is_approved = true
      and public.has_active_subscription(auth.uid())
      and public.has_active_subscription(profile_id)
    )
  );

drop policy if exists "users send interests as themselves" on public.interests;

create policy "subscribed users send interests as themselves" on public.interests
  for insert with check (
    auth.uid() = sender_id and public.has_active_subscription(auth.uid())
  );
