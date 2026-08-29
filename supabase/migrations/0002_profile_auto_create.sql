-- Create a profiles row automatically when a new auth user signs up.
-- Runs as SECURITY DEFINER so it succeeds even though the client has no
-- authenticated session yet at signup time (e.g. email confirmation
-- pending), which the "profiles_insert_own" RLS policy would otherwise block.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    -- Signup metadata is client-controlled input: only trust it for the
    -- two self-service roles, never let it grant 'admin'.
    case
      when new.raw_user_meta_data->>'role' in ('student', 'mentor')
        then new.raw_user_meta_data->>'role'
      else 'student'
    end,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
