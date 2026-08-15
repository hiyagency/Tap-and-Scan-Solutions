insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', 'Abhigyan Pandey'), 'owner'::public.app_role
from auth.users
where lower(email) = 'hello@hiy.agency'
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = 'owner'::public.app_role;
