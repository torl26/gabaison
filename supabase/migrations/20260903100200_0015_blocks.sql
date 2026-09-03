-- Blocking: hides a blocked user's profile from the blocker (and vice
-- versa), stops new match requests between them, and force-cancels any
-- match already in progress. Effects are enforced entirely through RLS
-- policy changes below, so no application-side branching is needed.

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

create policy "blocks_select_own" on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "blocks_insert_own" on public.blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "blocks_delete_own" on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- Bidirectional: it doesn't matter who blocked whom, the relationship
-- restricts both sides equally.
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- profiles_select_authenticated (below) hides a blocked counterpart's row
-- from both sides, which would also hide them from the blocker's own
-- "blocked users" list. That screen resolves names through this narrow
-- SECURITY DEFINER function instead of a direct `profiles` select.
create or replace function public.get_blocked_profiles()
returns table (id uuid, name text, avatar_url text, blocked_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.avatar_url, b.created_at as blocked_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;

drop policy "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or not public.is_blocked(id, (select auth.uid()))
  );

drop policy "match_requests_insert_student" on public.match_requests;
create policy "match_requests_insert_student" on public.match_requests
  for insert to authenticated
  with check (
    (select auth.uid()) = student_id
    and not public.is_blocked(student_id, mentor_id)
  );

-- Extend the existing status-transition guard so a block-triggered
-- cancellation is allowed regardless of whose turn the request "belongs"
-- to below (same shape as the 'completed' branch added in migration 0014).
create or replace function public.enforce_match_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.student_id is distinct from old.student_id
     or new.mentor_id is distinct from old.mentor_id
     or new.category_id is distinct from old.category_id then
    raise exception 'student_id, mentor_id, and category_id cannot be changed';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'cancelled' and public.is_blocked(old.student_id, old.mentor_id) then
      null; -- either party's block action may force-cancel this match
    elsif new.status = 'completed' then
      if old.status <> 'accepted' then
        raise exception 'only an accepted request can be completed';
      end if;
      if auth.uid() <> old.mentor_id and auth.uid() <> old.student_id then
        raise exception 'only the mentor or student on this request can complete it';
      end if;
    elsif auth.uid() = old.mentor_id then
      if new.status not in ('accepted', 'rejected') then
        raise exception 'mentor can only change status to accepted or rejected';
      end if;
      if old.status <> 'pending' then
        raise exception 'only a pending request can be accepted or rejected';
      end if;
    elsif auth.uid() = old.student_id then
      if old.status <> 'pending' or new.status <> 'cancelled' then
        raise exception 'student can only cancel a pending request';
      end if;
    else
      raise exception 'only the mentor or student on this request can change its status';
    end if;
  end if;

  return new;
end;
$$;

-- Force-cancel any in-progress match between the two parties as soon as
-- either one blocks the other. Existing rules already stop new messages
-- once status is no longer 'accepted' (messages_insert_accepted_participant)
-- and hide the chat room (ChatPage's `status !== 'accepted'` branch), so no
-- further changes are needed to shut down messaging.
create or replace function public.cancel_matches_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.match_requests
  set status = 'cancelled'
  where status in ('pending', 'accepted')
    and (
      (student_id = new.blocker_id and mentor_id = new.blocked_id)
      or (student_id = new.blocked_id and mentor_id = new.blocker_id)
    );
  return new;
end;
$$;

create trigger on_block_cancel_matches
  after insert on public.blocks
  for each row
  execute function public.cancel_matches_on_block();
