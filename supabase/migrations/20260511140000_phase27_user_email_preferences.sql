-- Phase 27: per-user marketplace email notification preferences.

create table if not exists public.user_email_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  quote_emails boolean not null default true,
  message_emails boolean not null default true,
  review_emails boolean not null default true,
  marketing_emails boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_email_preferences_set_updated_at on public.user_email_preferences;
create trigger user_email_preferences_set_updated_at
before update on public.user_email_preferences
for each row
execute function public.update_updated_at_column();

alter table public.user_email_preferences enable row level security;

drop policy if exists "user_email_preferences_select_own_or_admin" on public.user_email_preferences;
create policy "user_email_preferences_select_own_or_admin"
  on public.user_email_preferences
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "user_email_preferences_insert_own" on public.user_email_preferences;
create policy "user_email_preferences_insert_own"
  on public.user_email_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "user_email_preferences_update_own" on public.user_email_preferences;
create policy "user_email_preferences_update_own"
  on public.user_email_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
