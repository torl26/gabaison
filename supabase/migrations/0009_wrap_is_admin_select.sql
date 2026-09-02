-- Migration 0008 called public.is_admin() as a bare function in the
-- match_requests/messages SELECT policies. Because is_admin() is a
-- SECURITY DEFINER SQL function, the planner cannot inline it, so it
-- re-evaluates per row — silently undoing migration 0005's whole point
-- (wrapping auth.uid() in (select ...) to avoid per-row re-evaluation).
-- Wrap it the same way. Also check is_admin() first in the messages
-- policy: as an uncorrelated InitPlan it evaluates once, so an admin
-- session then skips the per-row match_requests EXISTS entirely.
drop policy "match_requests_select_participant" on public.match_requests;
create policy "match_requests_select_participant" on public.match_requests
  for select to authenticated
  using (
    (select auth.uid()) = student_id
    or (select auth.uid()) = mentor_id
    or (select public.is_admin())
  );

drop policy "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and (
          mr.student_id = (select auth.uid())
          or mr.mentor_id = (select auth.uid())
        )
    )
  );
