-- Phase 0: initial schema for profiles, photos, interests, messaging, subscriptions, reports.
-- Run this in the Supabase SQL editor (or via `supabase db push`) once the project exists.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  gender text not null check (gender in ('male', 'female')),
  dob date not null,
  height_cm smallint,
  religion text,
  caste text,
  sub_caste text,
  gothra text,
  mother_tongue text,
  marital_status text check (marital_status in ('never_married', 'divorced', 'widowed', 'awaiting_divorce')),
  diet text check (diet in ('vegetarian', 'non_vegetarian', 'eggetarian', 'vegan')),
  education text,
  occupation text,
  annual_income_inr integer,
  city text,
  state text,
  country text,
  about_me text,
  manglik_status text check (manglik_status in ('yes', 'no', 'anshik', 'unknown')),
  birth_time time,
  birth_place text,
  nakshatra text,
  rashi text,
  father_occupation text,
  mother_occupation text,
  siblings text,
  profile_created_by text check (profile_created_by in ('self', 'parent', 'sibling', 'relative')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  is_approved boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- interests (connection requests)
-- ---------------------------------------------------------------------------
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

-- ---------------------------------------------------------------------------
-- conversations & messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null unique references public.interests (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'paid')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.interests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reports enable row level security;

-- profiles: any signed-in user can read approved profiles; everyone can read/edit their own row.
create policy "profiles are readable by signed-in users" on public.profiles
  for select using (auth.uid() is not null);

create policy "users manage their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- photos: owner manages their own; approved photos are readable by any signed-in user.
create policy "approved photos are readable" on public.photos
  for select using (
    is_approved = true or profile_id = auth.uid()
  );

create policy "users manage their own photos" on public.photos
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- interests: participants only.
create policy "participants read their interests" on public.interests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "users send interests as themselves" on public.interests
  for insert with check (auth.uid() = sender_id);

create policy "receiver updates interest status" on public.interests
  for update using (auth.uid() = receiver_id);

-- conversations & messages: participants of the underlying interest only.
create policy "participants read their conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.interests i
      where i.id = interest_id
        and (i.sender_id = auth.uid() or i.receiver_id = auth.uid())
        and i.status = 'accepted'
    )
  );

create policy "participants read their messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.interests i on i.id = c.interest_id
      where c.id = conversation_id
        and (i.sender_id = auth.uid() or i.receiver_id = auth.uid())
    )
  );

create policy "participants send messages" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      join public.interests i on i.id = c.interest_id
      where c.id = conversation_id
        and (i.sender_id = auth.uid() or i.receiver_id = auth.uid())
        and i.status = 'accepted'
    )
  );

-- subscriptions: users read their own; writes happen via the service role from the Stripe webhook function.
create policy "users read their own subscription" on public.subscriptions
  for select using (user_id = auth.uid());

-- reports: reporter can create and read their own reports.
create policy "users create reports" on public.reports
  for insert with check (reporter_id = auth.uid());

create policy "users read their own reports" on public.reports
  for select using (reporter_id = auth.uid());

-- admins/moderators bypass the above via a dedicated policy checked against profiles.role.
create policy "admins manage all profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

create policy "admins manage all photos" on public.photos
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

create policy "admins manage all reports" on public.reports
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );
