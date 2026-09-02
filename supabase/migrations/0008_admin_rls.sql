-- Lets admins read all match_requests and messages for monitoring, without
-- introducing a service-role client — the app has used RLS as its only
-- authorization mechanism throughout, so this extends that same model.
-- is_admin() checks the CALLING user's own role (auth.uid()), so it is
-- safe to leave callable directly (unlike the trigger-only functions in
-- migration 0005, which we revoked EXECUTE on): calling it yourself only
-- ever tells you your own admin status.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy "match_requests_select_participant" on public.match_requests;
create policy "match_requests_select_participant" on public.match_requests
  for select to authenticated
  using (
    (select auth.uid()) = student_id
    or (select auth.uid()) = mentor_id
    or public.is_admin()
  );

drop policy "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and (
          mr.student_id = (select auth.uid())
          or mr.mentor_id = (select auth.uid())
        )
    )
    or public.is_admin()
  );
