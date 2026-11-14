-- First-party product analytics: one row per event, written by the site with the public key.
-- No third-party service, no emails or payment details are stored (only the Clerk user id).
create table if not exists public.analytics_events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  event        text not null check (char_length(event) between 1 and 64),
  anon_id      text not null check (char_length(anon_id) <= 64),   -- random id per browser
  session_id   text check (char_length(session_id) <= 64),
  user_id      text check (char_length(user_id) <= 128),           -- Clerk user id when signed in
  path         text check (char_length(path) <= 300),
  referrer     text check (char_length(referrer) <= 200),          -- hostname only
  utm_source   text check (char_length(utm_source) <= 100),
  utm_medium   text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  device       text check (device in ('mobile', 'desktop')),
  is_pwa       boolean not null default false,                      -- opened from the installed app
  props        jsonb check (props is null or pg_column_size(props) < 2048)
);

create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_idx   on public.analytics_events (event, created_at desc);
create index if not exists analytics_events_user_idx    on public.analytics_events (user_id, created_at desc);
create index if not exists analytics_events_anon_idx    on public.analytics_events (anon_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Anyone can add events; nobody can read them with the public key (no select policy).
-- Read them in the Supabase SQL editor (service role) — see docs/analytics-queries.sql.
drop policy if exists "analytics insert only" on public.analytics_events;
create policy "analytics insert only" on public.analytics_events
  for insert to anon, authenticated with check (true);
