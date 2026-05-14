-- Phase 29: admin audit logs (RLS + definer logging) and platform health RPC.

-- ---------------------------------------------------------------------------
-- admin_audit_logs
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action);

create index if not exists admin_audit_logs_entity_type_idx
  on public.admin_audit_logs (entity_type);

comment on table public.admin_audit_logs is 'Internal admin-only activity log; writes via SECURITY DEFINER helpers and triggers.';

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_admin_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_select"
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

grant select on public.admin_audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- admin_log_action: SECURITY DEFINER insert helper (not exposed to clients)
-- ---------------------------------------------------------------------------

create or replace function public.admin_log_action(
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.admin_audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (
    p_actor_id,
    nullif(trim(coalesce(p_actor_role, '')), ''),
    trim(p_action),
    nullif(trim(coalesce(p_entity_type, '')), ''),
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.admin_log_action(uuid, text, text, text, uuid, jsonb) is
  'Writes an admin_audit_logs row as definer owner. Used by triggers and admin RPCs; execute is not granted to anon/authenticated.';

revoke all on function public.admin_log_action(uuid, text, text, text, uuid, jsonb) from public;
revoke all on function public.admin_log_action(uuid, text, text, text, uuid, jsonb) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_list_audit_logs (admin read RPC)
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_audit_logs(
  p_action text default null,
  p_entity_type text default null,
  p_limit integer default 100
)
returns table (
  id uuid,
  actor_id uuid,
  actor_role text,
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    a.id,
    a.actor_id,
    a.actor_role,
    a.action,
    a.entity_type,
    a.entity_id,
    a.metadata,
    a.created_at
  from public.admin_audit_logs a
  where (p_action is null or trim(p_action) = '' or a.action = trim(p_action))
    and (p_entity_type is null or trim(p_entity_type) = '' or a.entity_type = trim(p_entity_type))
  order by a.created_at desc
  limit v_limit;
end;
$$;

grant execute on function public.admin_list_audit_logs(text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_platform_health_snapshot
-- ---------------------------------------------------------------------------

create or replace function public.admin_platform_health_snapshot()
returns table (
  customer_total bigint,
  vendor_total bigint,
  pending_vendors bigint,
  completed_vendor_profiles bigint,
  open_events bigint,
  quote_volume bigint,
  message_volume bigint,
  review_volume bigint,
  attention_items_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)::bigint from public.profiles c where c.role = 'customer'),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor'),
    (
      select count(*)::bigint
      from public.profiles v
      where v.role = 'vendor'
        and coalesce(v.is_profile_complete, false) = false
    ),
    (
      select count(*)::bigint
      from public.profiles v
      where v.role = 'vendor'
        and coalesce(v.is_profile_complete, false) = true
    ),
    (select count(*)::bigint from public.events e where e.status = 'active'),
    (select count(*)::bigint from public.quotes),
    (select count(*)::bigint from public.messages),
    (select count(*)::bigint from public.reviews),
    (
      (
        select count(*)::bigint
        from public.profiles v
        where v.role = 'vendor'
          and coalesce(v.is_profile_complete, false) = true
          and coalesce(v.is_public, true) = false
      )
      + (select count(*)::bigint from public.reviews r where r.is_public = false)
    );
end;
$$;

grant execute on function public.admin_platform_health_snapshot() to authenticated;

comment on function public.admin_platform_health_snapshot() is
  'Admin-only snapshot: population counts, volumes, and attention_items_count (complete-but-hidden vendors plus non-public reviews).';

-- ---------------------------------------------------------------------------
-- Trigger writers
-- ---------------------------------------------------------------------------

create or replace function public.audit_trg_admin_credit_adjustment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  if new.adjustment_type in ('promotional', 'bonus') then
    v_action := 'credits_granted';
  else
    v_action := 'credits_adjustment_recorded';
  end if;

  perform public.admin_log_action(
    new.admin_id,
    'admin',
    v_action,
    'vendor',
    new.vendor_id,
    jsonb_build_object(
      'adjustment_id', new.id,
      'adjustment_type', new.adjustment_type,
      'credits_added', new.credits_added,
      'reason', new.reason
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_admin_credit_adjustment on public.admin_credit_adjustments;
create trigger trg_audit_admin_credit_adjustment
after insert on public.admin_credit_adjustments
for each row
execute function public.audit_trg_admin_credit_adjustment();

create or replace function public.audit_trg_event_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  select p.role::text into v_role from public.profiles p where p.id = new.customer_id;

  perform public.admin_log_action(
    new.customer_id,
    v_role,
    'event_created',
    'event',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'status', new.status,
      'neighborhood', new.neighborhood
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_event_created on public.events;
create trigger trg_audit_event_created
after insert on public.events
for each row
execute function public.audit_trg_event_created();

create or replace function public.audit_trg_conversation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  select p.role::text into v_role from public.profiles p where p.id = v_uid;

  perform public.admin_log_action(
    v_uid,
    v_role,
    'message_thread_created',
    'conversation',
    new.id,
    jsonb_build_object(
      'customer_id', new.customer_id,
      'vendor_id', new.vendor_id,
      'event_id', new.event_id,
      'quote_id', new.quote_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_conversation_created on public.conversations;
create trigger trg_audit_conversation_created
after insert on public.conversations
for each row
execute function public.audit_trg_conversation_created();

create or replace function public.audit_trg_review_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  perform public.admin_log_action(
    new.customer_id,
    'customer',
    'review_submitted',
    'review',
    new.id,
    jsonb_build_object(
      'vendor_id', new.vendor_id,
      'event_id', new.event_id,
      'quote_id', new.quote_id,
      'rating', new.rating,
      'is_public', new.is_public
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_review_submitted on public.reviews;
create trigger trg_audit_review_submitted
after insert on public.reviews
for each row
execute function public.audit_trg_review_submitted();

create or replace function public.audit_trg_vendor_profile_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.role is distinct from 'vendor' then
    return new;
  end if;

  if coalesce(old.is_profile_complete, false) or not coalesce(new.is_profile_complete, false) then
    return new;
  end if;

  select p.role::text into v_role from public.profiles p where p.id = v_uid;

  perform public.admin_log_action(
    v_uid,
    coalesce(v_role, 'vendor'),
    'vendor_profile_completed',
    'profile',
    new.id,
    jsonb_build_object('business_name', new.business_name, 'slug', new.slug)
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_vendor_profile_completed on public.profiles;
create trigger trg_audit_vendor_profile_completed
after update of is_profile_complete on public.profiles
for each row
execute function public.audit_trg_vendor_profile_completed();

-- ---------------------------------------------------------------------------
-- Quote customer RPCs (append audit)
-- ---------------------------------------------------------------------------

create or replace function public.customer_accept_quote(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_event_service_id uuid;
  v_customer_id uuid;
begin
  if v_uid is null then
    raise exception 'You must be signed in.';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'customer' then
    raise exception 'Only customers can accept quotes.';
  end if;

  select q.event_service_id
  into v_event_service_id
  from public.quotes q
  where q.id = p_quote_id
  for update;

  if v_event_service_id is null then
    raise exception 'Quote not found.';
  end if;

  select e.customer_id
  into v_customer_id
  from public.event_services es
  join public.events e on e.id = es.event_id
  where es.id = v_event_service_id;

  if v_customer_id is distinct from v_uid then
    raise exception 'You cannot manage quotes for this event.';
  end if;

  update public.quotes q
  set status = 'declined'
  where q.event_service_id = v_event_service_id
    and q.id <> p_quote_id;

  update public.quotes q
  set status = 'accepted'
  where q.id = p_quote_id;

  perform public.admin_log_action(
    v_uid,
    v_role,
    'quote_accepted',
    'quote',
    p_quote_id,
    jsonb_build_object('event_service_id', v_event_service_id)
  );
end;
$$;

create or replace function public.customer_decline_quote(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_customer_id uuid;
  v_status text;
begin
  if v_uid is null then
    raise exception 'You must be signed in.';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'customer' then
    raise exception 'Only customers can decline quotes.';
  end if;

  select q.status
  into v_status
  from public.quotes q
  where q.id = p_quote_id
  for update;

  if v_status is null then
    raise exception 'Quote not found.';
  end if;

  select e.customer_id
  into v_customer_id
  from public.quotes q
  join public.event_services es on es.id = q.event_service_id
  join public.events e on e.id = es.event_id
  where q.id = p_quote_id;

  if v_customer_id is null then
    raise exception 'Quote not found.';
  end if;

  if v_customer_id is distinct from v_uid then
    raise exception 'You cannot manage quotes for this event.';
  end if;

  if v_status = 'declined' then
    return;
  end if;

  if v_status is distinct from 'pending' then
    raise exception 'Only pending quotes can be declined.';
  end if;

  update public.quotes q
  set status = 'declined'
  where q.id = p_quote_id;

  perform public.admin_log_action(
    v_uid,
    v_role,
    'quote_declined',
    'quote',
    p_quote_id,
    '{}'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin marketplace + profile status RPCs (append audit)
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_vendor_marketplace_flags(
  p_vendor_id uuid,
  p_is_public boolean,
  p_is_featured boolean,
  p_admin_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_old_public boolean;
  v_action text;
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = v_admin and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  select coalesce(p.is_public, true)
  into v_old_public
  from public.profiles p
  where p.id = p_vendor_id
    and p.role = 'vendor'
  for update;

  if not found then
    raise exception 'vendor profile not found';
  end if;

  update public.profiles
  set
    is_public = p_is_public,
    is_featured = p_is_featured,
    admin_notes = nullif(trim(p_admin_notes), '')
  where id = p_vendor_id
    and role = 'vendor';

  if coalesce(v_old_public, true) is distinct from coalesce(p_is_public, true) then
    if coalesce(p_is_public, true) then
      v_action := 'vendor_approved';
    else
      v_action := 'vendor_rejected';
    end if;
  else
    v_action := 'vendor_marketplace_updated';
  end if;

  perform public.admin_log_action(
    v_admin,
    'admin',
    v_action,
    'vendor',
    p_vendor_id,
    jsonb_build_object(
      'is_public', p_is_public,
      'is_featured', p_is_featured,
      'previous_is_public', v_old_public
    )
  );
end;
$$;

create or replace function public.admin_set_profile_status(
  p_profile_id uuid,
  p_action text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_role text;
begin
  if v_admin is null then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1 from public.profiles pr where pr.id = v_admin and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if p_profile_id = v_admin then
    raise exception 'You cannot change your own account status here.';
  end if;

  select role into v_role from public.profiles where id = p_profile_id;
  if v_role is null then
    raise exception 'profile not found';
  end if;

  if v_role = 'admin' then
    raise exception 'Admin accounts cannot be suspended via this tool.';
  end if;

  if p_action = 'suspend' then
    update public.profiles
    set
      status = 'suspended',
      suspended_at = now(),
      suspended_reason = nullif(trim(p_reason), '')
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'restore' then
    update public.profiles
    set
      status = 'active',
      suspended_at = null,
      suspended_reason = null
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'deactivate' then
    update public.profiles
    set
      status = 'deactivated',
      suspended_at = coalesce(suspended_at, now()),
      suspended_reason = coalesce(nullif(trim(p_reason), ''), suspended_reason, 'Account deactivated.')
    where id = p_profile_id
      and role in ('customer', 'vendor');
  else
    raise exception 'invalid action';
  end if;

  if not found then
    raise exception 'profile not updated';
  end if;

  perform public.admin_log_action(
    v_admin,
    'admin',
    'admin_user_status_changed',
    'profile',
    p_profile_id,
    jsonb_build_object('status_action', p_action, 'target_role', v_role, 'reason', nullif(trim(p_reason), ''))
  );
end;
$$;
