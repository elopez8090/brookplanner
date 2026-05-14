-- Phase 24: basic customer/vendor messaging after quote acceptance.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists conversations_customer_vendor_event_quote_unique
  on public.conversations (customer_id, vendor_id, event_id, quote_id);
create index if not exists conversations_customer_id_idx on public.conversations (customer_id);
create index if not exists conversations_vendor_id_idx on public.conversations (vendor_id);
create index if not exists conversations_event_id_idx on public.conversations (event_id);
create index if not exists conversations_quote_id_idx on public.conversations (quote_id);
create index if not exists conversations_updated_at_desc_idx on public.conversations (updated_at desc);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_read_at_idx on public.messages (read_at);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.update_updated_at_column();

create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation_updated_at on public.messages;
create trigger messages_touch_conversation_updated_at
after insert on public.messages
for each row
execute function public.touch_conversation_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_participants_or_admin" on public.conversations;
create policy "conversations_select_participants_or_admin"
  on public.conversations
  for select
  to authenticated
  using (
    customer_id = (select auth.uid())
    or vendor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "conversations_insert_participants_or_admin" on public.conversations;
create policy "conversations_insert_participants_or_admin"
  on public.conversations
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
    or vendor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "conversations_update_participants_or_admin" on public.conversations;
create policy "conversations_update_participants_or_admin"
  on public.conversations
  for update
  to authenticated
  using (
    customer_id = (select auth.uid())
    or vendor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    customer_id = (select auth.uid())
    or vendor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "messages_select_participants_or_admin" on public.messages;
create policy "messages_select_participants_or_admin"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.customer_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
          )
        )
    )
  );

drop policy if exists "messages_insert_participants_or_admin" on public.messages;
create policy "messages_insert_participants_or_admin"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.customer_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
          )
        )
    )
  );

drop policy if exists "messages_update_participants_or_admin" on public.messages;
create policy "messages_update_participants_or_admin"
  on public.messages
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.customer_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.customer_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
          )
        )
    )
  );

grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;
