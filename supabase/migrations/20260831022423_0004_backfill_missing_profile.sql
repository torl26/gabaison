-- Backfills the profiles row for an auth.users account created before
-- migration 0002 (profile auto-create trigger) existed.
insert into public.profiles (id, role, name, bio)
values ('c3710cba-120f-48a9-8eac-240645a65e99', 'student', 'tsutsumisouma', '')
on conflict (id) do nothing;
