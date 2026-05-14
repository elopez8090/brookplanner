-- Phase 11: vendor profiles, public vendor page data, and vendor media storage.

alter table public.profiles
  add column if not exists business_name text,
  add column if not exists slug text,
  add column if not exists bio text,
  add column if not exists business_phone text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists tiktok text,
  add column if not exists service_areas text,
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists is_profile_complete boolean not null default false;

create unique index if not exists profiles_vendor_slug_unique_idx
  on public.profiles (slug)
  where role = 'vendor' and slug is not null;

create index if not exists profiles_vendor_slug_lookup_idx
  on public.profiles (slug)
  where role = 'vendor';

create or replace function public.slugify_text(value text)
returns text
language sql
immutable
as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g')), '');
$$;

create or replace function public.vendor_profile_is_complete(
  p_business_name text,
  p_slug text,
  p_bio text,
  p_business_phone text,
  p_service_areas text
)
returns boolean
language sql
immutable
as $$
  select
    coalesce(length(trim(p_business_name)) > 1, false)
    and coalesce(length(trim(p_slug)) > 1, false)
    and coalesce(length(trim(p_bio)) > 20, false)
    and coalesce(length(trim(p_business_phone)) > 6, false)
    and coalesce(length(trim(p_service_areas)) > 2, false);
$$;

create or replace function public.set_vendor_profile_completeness()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'vendor' then
    new.is_profile_complete := public.vendor_profile_is_complete(
      new.business_name,
      new.slug,
      new.bio,
      new.business_phone,
      new.service_areas
    );
  else
    new.is_profile_complete := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_vendor_profile_completeness on public.profiles;
create trigger trg_set_vendor_profile_completeness
before insert or update on public.profiles
for each row
execute function public.set_vendor_profile_completeness();

update public.profiles
set is_profile_complete = public.vendor_profile_is_complete(
  business_name,
  slug,
  bio,
  business_phone,
  service_areas
)
where role = 'vendor';

create or replace function public.public_vendor_page(p_slug text)
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  bio text,
  business_phone text,
  website text,
  instagram text,
  facebook text,
  tiktok text,
  service_areas text,
  logo_url text,
  cover_image_url text,
  categories text[]
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
    and p.slug = p_slug
  group by
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url
  limit 1;
$$;

grant execute on function public.public_vendor_page(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values
  ('vendor-logos', 'vendor-logos', true),
  ('vendor-covers', 'vendor-covers', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "vendor_media_public_read" on storage.objects;
create policy "vendor_media_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id in ('vendor-logos', 'vendor-covers'));

drop policy if exists "vendor_media_vendor_insert_own" on storage.objects;
create policy "vendor_media_vendor_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('vendor-logos', 'vendor-covers')
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
  );

drop policy if exists "vendor_media_vendor_update_own" on storage.objects;
create policy "vendor_media_vendor_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('vendor-logos', 'vendor-covers')
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
  )
  with check (
    bucket_id in ('vendor-logos', 'vendor-covers')
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
  );

drop policy if exists "vendor_media_vendor_delete_own" on storage.objects;
create policy "vendor_media_vendor_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('vendor-logos', 'vendor-covers')
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
  );
