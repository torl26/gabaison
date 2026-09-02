-- Performance: avoid per-row re-evaluation of auth.uid() in RLS policies
-- by wrapping calls in (select ...), per Supabase's recommended pattern.

drop policy "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and role in ('student', 'mentor'));

drop policy "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id);

drop policy "mentor_categories_insert_own" on public.mentor_categories;
create policy "mentor_categories_insert_own" on public.mentor_categories
  for insert to authenticated
  with check ((select auth.uid()) = mentor_id);

drop policy "mentor_categories_delete_own" on public.mentor_categories;
create policy "mentor_categories_delete_own" on public.mentor_categories
  for delete to authenticated
  using ((select auth.uid()) = mentor_id);

drop policy "match_requests_select_participant" on public.match_requests;
create policy "match_requests_select_participant" on public.match_requests
  for select to authenticated
  using ((select auth.uid()) = student_id or (select auth.uid()) = mentor_id);

drop policy "match_requests_insert_student" on public.match_requests;
create policy "match_requests_insert_student" on public.match_requests
  for insert to authenticated
  with check ((select auth.uid()) = student_id);

drop policy "match_requests_update_participant" on public.match_requests;
create policy "match_requests_update_participant" on public.match_requests
  for update to authenticated
  using ((select auth.uid()) = student_id or (select auth.uid()) = mentor_id);

drop policy "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and (mr.student_id = (select auth.uid()) or mr.mentor_id = (select auth.uid()))
    )
  );

drop policy "messages_insert_accepted_participant" on public.messages;
create policy "messages_insert_accepted_participant" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and mr.status = 'accepted'
        and (mr.student_id = (select auth.uid()) or mr.mentor_id = (select auth.uid()))
    )
  );

-- Performance: index foreign key columns flagged by the Supabase linter.
create index if not exists match_requests_category_id_idx on public.match_requests (category_id);
create index if not exists match_requests_mentor_id_idx on public.match_requests (mentor_id);
create index if not exists match_requests_student_id_idx on public.match_requests (student_id);
create index if not exists mentor_categories_category_id_idx on public.mentor_categories (category_id);
create index if not exists messages_match_id_idx on public.messages (match_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

-- Security: these functions only exist to be called by triggers, not as
-- public RPCs (e.g. POST /rest/v1/rpc/handle_new_user). Revoking EXECUTE
-- does not affect trigger firing, which isn't gated by caller privileges.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_profile_role_change() from public, anon, authenticated;
revoke execute on function public.enforce_match_request_update() from public, anon, authenticated;
