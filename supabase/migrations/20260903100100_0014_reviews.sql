-- Reviews: a student rates the mentor after a finished consultation.
--
-- Requires a terminal state for a consultation that actually happened, so
-- match_requests gains a 'completed' status that either participant can set
-- once the request has been accepted.

alter table public.match_requests
  drop constraint match_requests_status_check;

alter table public.match_requests
  add constraint match_requests_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

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
    if new.status = 'completed' then
      -- Either side may close out a consultation, but only one that started.
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
      -- Without this a mentor could reopen a completed or cancelled request.
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

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  -- One review per consultation.
  unique (match_id, reviewer_id)
);

create index reviews_reviewee_id_idx on public.reviews (reviewee_id, created_at desc);

alter table public.reviews enable row level security;

-- Reviews are shown on public mentor profiles.
create policy "reviews_select_authenticated" on public.reviews
  for select to authenticated using (true);

-- Only the student of a completed match may review, and only the mentor who
-- was on that same match.
create policy "reviews_insert_student_on_completed_match" on public.reviews
  for insert to authenticated with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.match_requests mr
      where mr.id = reviews.match_id
        and mr.status = 'completed'
        and mr.student_id = auth.uid()
        and mr.mentor_id = reviews.reviewee_id
    )
  );

-- No update or delete policy: a posted review is immutable, so a mentor
-- cannot pressure a student into quietly editing one away.
