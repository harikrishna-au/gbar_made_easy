-- Generic prep survey: not tied to one company
alter table public.feedback
  add column if not exists target_company text,
  add column if not exists preparing_for text,
  add column if not exists help_needed text;

comment on column public.feedback.target_company is 'Company(ies) the student is preparing for';
comment on column public.feedback.preparing_for is 'Rounds the student is preparing for (comma separated)';
comment on column public.feedback.help_needed is 'Free text: what the student wants help with';
