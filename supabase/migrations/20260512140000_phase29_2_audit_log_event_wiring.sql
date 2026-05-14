-- Phase 29.2: best-effort audit writes + richer metadata for admin marketplace,
-- account status, and credit adjustment audit events.

-- ---------------------------------------------------------------------------
-- admin_try_log_action: never raises (audit must not break caller txn)
-- ---------------------------------------------------------------------------

create or replace function public.admin_try_log_action(
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_log_action(
    p_actor_id,
    p_actor_role,
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
exception
  when others then
    null;
end;
$$;

comment on function public.admin_try_log_action(uuid, text, text, text, uuid, jsonb) is
  'Wraps admin_log_action; swallows errors so primary business logic always commits.';

revoke all on function public.admin_try_log_action(uuid, text, text, text, uuid, jsonb) from public;
revoke all on function public.admin_try_log_action(uuid, text, text, text, uuid, jsonb) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Credit adjustment trigger: vendor_id + credits_amount + safe log
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

  perform public.admin_try_log_action(
    new.admin_id,
    'admin',
    v_action,
    'vendor',
    new.vendor_id,
    jsonb_build_object(
      'adjustment_id', new.id,
      'vendor_id', new.vendor_id,
      'adjustment_type', new.adjustment_type,
      'credits_amount', new.credits_added,
      'credits_added', new.credits_added,
      'reason', new.reason
    )
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Other Phase 29 audit triggers + customer quote RPCs: safe log only
-- ---------------------------------------------------------------------------

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

  perform public.admin_try_log_action(
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

  perform public.admin_try_log_action(
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

  perform public.admin_try_log_action(
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

  perform public.admin_try_log_action(
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

  perform public.admin_try_log_action(
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

  perform public.admin_try_log_action(
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
-- Admin marketplace flags: vendor_id + listing status labels + safe log
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

  perform public.admin_try_log_action(
    v_admin,
    'admin',
    v_action,
    'vendor',
    p_vendor_id,
    jsonb_build_object(
      'vendor_id', p_vendor_id,
      'previous_status', case when coalesce(v_old_public, true) then 'listed' else 'hidden' end,
      'new_status', case when coalesce(p_is_public, true) then 'listed' else 'hidden' end,
      'previous_is_public', v_old_public,
      'is_public', p_is_public,
      'is_featured', p_is_featured
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin profile status: previous/new account status, vendor_id/customer_id
-- ---------------------------------------------------------------------------

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
  v_old_status text;
  v_new_status text;
  v_audit_action text;
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

  select role, coalesce(status, 'active')::text
  into v_role, v_old_status
  from public.profiles
  where id = p_profile_id
  for update;

  if not found or v_role is null then
    raise exception 'profile not found';
  end if;

  if v_role = 'admin' then
    raise exception 'Admin accounts cannot be suspended via this tool.';
  end if;

  if p_action = 'suspend' then
    v_new_status := 'suspended';
    update public.profiles
    set
      status = 'suspended',
      suspended_at = now(),
      suspended_reason = nullif(trim(p_reason), '')
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'restore' then
    v_new_status := 'active';
    update public.profiles
    set
      status = 'active',
      suspended_at = null,
      suspended_reason = null
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'deactivate' then
    v_new_status := 'deactivated';
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

  if v_role = 'vendor' then
    v_audit_action := 'vendor_account_status_changed';
  elsif v_role = 'customer' then
    v_audit_action := 'customer_account_status_changed';
  else
    v_audit_action := 'admin_user_status_changed';
  end if;

  perform public.admin_try_log_action(
    v_admin,
    'admin',
    v_audit_action,
    'profile',
    p_profile_id,
    jsonb_build_object(
      'previous_status', v_old_status,
      'new_status', v_new_status,
      'reason', nullif(trim(p_reason), ''),
      'vendor_id', case when v_role = 'vendor' then p_profile_id end,
      'customer_id', case when v_role = 'customer' then p_profile_id end,
      'status_action', p_action
    )
  );
end;
$$;
