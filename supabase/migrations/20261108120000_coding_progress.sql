-- Which coding questions a user has ticked off. One row per (user, question).
-- user_id is the Clerk user id (text), same pattern as resumes.
create table if not exists coding_progress (
  user_id    text not null,
  problem_id text not null,
  done_at    timestamptz not null default now(),
  primary key (user_id, problem_id)
);

alter table coding_progress enable row level security;

-- Same open policy as resumes: the app filters by user_id. Progress ticks are low
-- sensitivity; tighten with Clerk JWT claims if that ever changes.
create policy "coding_progress is app-scoped by user_id"
  on coding_progress for all
  using (true)
  with check (true);
