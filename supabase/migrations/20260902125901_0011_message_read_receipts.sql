-- Read receipts for chat messages. Since a match is always exactly two
-- participants, a single read_at timestamp per message (set by whichever
-- participant did not send it) is enough to represent "has the recipient
-- read this" without a separate per-recipient table.
alter table public.messages add column read_at timestamptz;

create policy "messages_update_mark_read" on public.messages
  for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and (
          mr.student_id = (select auth.uid())
          or mr.mentor_id = (select auth.uid())
        )
    )
  );

-- The update policy above only gates *who* may attempt an update; without
-- this trigger the recipient could rewrite content/sender_id/etc, not just
-- mark the message read.
create or replace function public.enforce_message_read_only_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.content is distinct from old.content
     or new.sender_id is distinct from old.sender_id
     or new.match_id is distinct from old.match_id
     or new.created_at is distinct from old.created_at then
    raise exception 'only read_at can be updated on a message';
  end if;

  return new;
end;
$$;

create trigger messages_enforce_read_only_update
  before update on public.messages
  for each row
  execute function public.enforce_message_read_only_update();

revoke execute on function public.enforce_message_read_only_update() from public, anon, authenticated;
