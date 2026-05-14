-- Read-only checks: auth.users vs public.profiles (run in SQL editor).
-- Does not modify data. Use results to decide manual INSERT fixes.

-- 1) Signed-up accounts with no profile row (these users hit /register after login).
select u.id, u.email, u.created_at as auth_created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
order by u.created_at desc;

-- 2) Profile rows with no auth user (orphaned profiles).
select p.id, p.full_name, p.role, p.status, p.created_at
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- 3) Roles outside app contract (expect lowercase admin, vendor, customer).
select id, full_name, role, status
from public.profiles
where lower(role::text) not in ('admin', 'vendor', 'customer')
   or role::text <> lower(role::text);

-- Example manual repair for a single missing profile (run only when appropriate):
-- insert into public.profiles (id, full_name, role)
-- values ('<auth.users.id>', 'Display Name', 'customer');
