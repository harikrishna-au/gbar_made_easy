-- Rich, optional details shown on /placement/:code (job id, about company, responsibilities, FAQs, ...)
alter table jobs add column if not exists details jsonb not null default '{}'::jsonb;
