-- Harry The Blaze: product analytics. Paste any block into the Supabase SQL editor.
-- Data comes from public.analytics_events (see supabase/migrations/20261114_analytics_events.sql).
-- Events: session_start, page_view, signed_in, signup, game_open, communication_open, infosys_open,
--         company_open, connect_view, connect_payment_started, connect_booking_paid,
--         premium_popup_view, payment_started, payment_success, payment_failed, payment_delayed,
--         ai_interview_open, blog_open, install_prompt_shown, install_prompt_result, pwa_installed.

-- 1) Visitors, signed-in users and sign-ups per day (last 30 days)
select created_at::date as day,
       count(distinct anon_id)                                  as visitors,
       count(distinct user_id)                                  as signed_in_users,
       count(*) filter (where event = 'signup')                 as signups
from analytics_events
where created_at > now() - interval '30 days'
group by 1 order by 1 desc;

-- 2) The funnel: of everyone who signed in over the last 30 days, how far did they get?
with u as (
  select user_id,
    bool_or(event in ('game_open', 'communication_open', 'infosys_open')) as practised,
    bool_or(event = 'premium_popup_view')   as saw_premium,
    bool_or(event = 'payment_started')      as started_payment,
    bool_or(event = 'payment_success')      as paid_premium,
    bool_or(event = 'connect_view')         as saw_connect,
    bool_or(event = 'connect_payment_started') as started_connect_payment,
    bool_or(event = 'connect_booking_paid') as booked_connect
  from analytics_events
  where user_id is not null and created_at > now() - interval '30 days'
  group by user_id
)
select count(*)                                           as signed_in_users,
       count(*) filter (where practised)                  as practised,
       count(*) filter (where saw_premium)                as saw_premium_popup,
       count(*) filter (where started_payment)            as started_premium_payment,
       count(*) filter (where paid_premium)               as paid_premium,
       count(*) filter (where saw_connect)                as saw_connect,
       count(*) filter (where started_connect_payment)    as started_connect_payment,
       count(*) filter (where booked_connect)             as booked_connect
from u;

-- 3) Retention by first-seen day: did they come back the next day / 7 days later / within a week?
with act as (
  select user_id, created_at::date as d
  from analytics_events
  where user_id is not null and event = 'page_view'
  group by 1, 2
), first_day as (
  select user_id, min(d) as d0 from act group by 1
), flags as (
  select f.user_id, f.d0,
         bool_or(a.d = f.d0 + 1)                    as d1,
         bool_or(a.d = f.d0 + 7)                    as d7,
         bool_or(a.d between f.d0 + 1 and f.d0 + 7) as back_in_week
  from first_day f join act a using (user_id)
  group by f.user_id, f.d0
)
select d0 as first_day, count(*) as users,
       round(100.0 * count(*) filter (where d1) / count(*), 1)           as day1_pct,
       round(100.0 * count(*) filter (where d7) / count(*), 1)           as day7_pct,
       round(100.0 * count(*) filter (where back_in_week) / count(*), 1) as back_within_7_days_pct
from flags
group by d0 order by d0 desc limit 30;

-- 4) Which features do people actually use? (last 30 days)
select event,
       coalesce(props ->> 'game', props ->> 'round', props ->> 'section', props ->> 'company', '') as what,
       count(*) as opens, count(distinct coalesce(user_id, anon_id)) as people
from analytics_events
where created_at > now() - interval '30 days'
  and event in ('game_open', 'communication_open', 'infosys_open', 'company_open', 'ai_interview_open', 'connect_view')
group by 1, 2 order by opens desc;

-- 5) Where do visitors come from, and how many sign up?
select coalesce(utm_source, referrer, '(direct)') as source,
       count(distinct anon_id) as visitors,
       count(distinct anon_id) filter (where event = 'signup') as signups
from analytics_events
where created_at > now() - interval '30 days'
group by 1 order by visitors desc limit 25;

-- 6) Android vs desktop, and how many open the installed app
select device, is_pwa, count(distinct anon_id) as people
from analytics_events
where created_at > now() - interval '30 days'
group by 1, 2 order by people desc;

-- 7) Installs: how many saw the install card, what they chose, and installs
select event, props ->> 'outcome' as outcome, count(*) as n
from analytics_events
where event in ('install_prompt_shown', 'install_prompt_result', 'install_prompt_dismissed', 'pwa_installed')
group by 1, 2 order by n desc;

-- 8) Payment health: started vs finished vs failed
select created_at::date as day,
       count(*) filter (where event = 'payment_started') as started,
       count(*) filter (where event = 'payment_success') as succeeded,
       count(*) filter (where event = 'payment_delayed') as delayed,
       count(*) filter (where event = 'payment_failed')  as failed
from analytics_events
where created_at > now() - interval '30 days' and event like 'payment_%'
group by 1 order by 1 desc;

-- 9) Optional housekeeping: keep only the last 6 months
-- delete from analytics_events where created_at < now() - interval '6 months';
