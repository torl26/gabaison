-- Private post-consultation feedback from both sides of a completed match.
create table public.consultation_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match_requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  author_role text not null check (author_role in ('student', 'mentor')),
  rating int not null check (rating between 1 and 5),
  reflection text not null default '' check (char_length(reflection) <= 500),
  created_at timestamptz not null default now(),
  unique (match_id, author_id)
);

create index consultation_feedback_target_idx
  on public.consultation_feedback (target_id, created_at desc);

alter table public.consultation_feedback enable row level security;

create policy "consultation_feedback_select_author_or_target"
  on public.consultation_feedback
  for select to authenticated
  using (author_id = (select auth.uid()) or target_id = (select auth.uid()));

create policy "consultation_feedback_insert_participant"
  on public.consultation_feedback
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.match_requests mr
      where mr.id = consultation_feedback.match_id
        and mr.status = 'completed'
        and (
          (mr.student_id = (select auth.uid())
            and consultation_feedback.author_role = 'student'
            and consultation_feedback.target_id = mr.mentor_id)
          or
          (mr.mentor_id = (select auth.uid())
            and consultation_feedback.author_role = 'mentor'
            and consultation_feedback.target_id = mr.student_id)
        )
    )
  );

-- Feedback is immutable once submitted.
