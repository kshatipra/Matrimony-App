# Matrimony

An Indian/South Asian matrimony app. Built with Expo (React Native + TypeScript, runs on web/iOS/Android from one codebase), Supabase (database, auth, storage, realtime), and Stripe (subscriptions).

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project's URL and anon key (see "Supabase setup" below).
3. Run the app on web:
   ```
   npm run web
   ```
   Or on a simulator/device: `npm run ios` / `npm run android` (requires Xcode / Android Studio).

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to Project Settings → API and copy the `Project URL` and `anon public` key into your `.env` file.
3. Open the SQL Editor in the Supabase dashboard and run the contents of `supabase/migrations/0001_initial_schema.sql` to create the tables and security policies.

## Project structure

- `app/` — screens and routes (Expo Router, file-based).
- `lib/supabase.ts` — Supabase client setup.
- `supabase/migrations/` — SQL schema, applied in order.

## Node version

This project requires Node 22.13+ (React Native's minimum). Run `nvm use` in this directory to pick up the version pinned in `.nvmrc`.
