-- Public share code for each opportunity: /placement/<code>
alter table jobs add column if not exists code text;

-- Codes are matched case-insensitively
create unique index if not exists jobs_code_unique on jobs (lower(code)) where code is not null;
