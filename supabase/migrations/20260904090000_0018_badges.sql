-- Badges: profile achievements shown on own/other profiles. Two sources:
--   'manual'      — admin creates freely (e.g. event participation) and
--                    grants it by hand to specific users
--   'match_count' — fixed catalog seeded below, auto-awarded by the
--                    trigger at the bottom of this file when a user's
--                    accepted-match total crosses 1 / 5 / 10
create table public.badge_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  icon text not null,
  source text not null check (source in ('manual', 'match_count')),
  threshold int,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint badge_definitions_threshold_only_for_match_count check (
    (source = 'match_count' and threshold is not null)
    or (source = 'manual' and threshold is null)
  )
);

alter table public.badge_definitions enable row level security;

create policy "badge_definitions_select_authenticated" on public.badge_definitions
  for select to authenticated using (true);

-- match_count rows are seeded directly below and never inserted through
-- this policy (source = 'manual' is enforced here).
create policy "badge_definitions_insert_admin" on public.badge_definitions
  for insert to authenticated
  with check (
    (select public.is_admin())
    and source = 'manual'
    and created_by = (select auth.uid())
  );

insert into public.badge_definitions (slug, label, icon, source, threshold) values
  ('match_count_1', '初マッチング達成', '🎯', 'match_count', 1),
  ('match_count_5', 'マッチング5件達成', '🔥', 'match_count', 5),
  ('match_count_10', 'マッチング10件達成', '🏆', 'match_count', 10);

-- user_badges: who has which badge, and when/by whom it was awarded.
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_definition_id uuid not null references public.badge_definitions(id) on delete cascade,
  awarded_by uuid references public.profiles(id),
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_definition_id)
);

alter table public.user_badges enable row level security;

-- Shown on public profiles (own and others'), same reasoning as
-- profiles_select_authenticated (migration 0001).
create policy "user_badges_select_authenticated" on public.user_badges
  for select to authenticated using (true);

-- Only manual badges can be granted through this policy; match_count
-- badges are only ever inserted by the SECURITY DEFINER trigger below,
-- which bypasses RLS as the function owner.
create policy "user_badges_insert_admin" on public.user_badges
  for insert to authenticated
  with check (
    (select public.is_admin())
    and awarded_by = (select auth.uid())
    and badge_definition_id in (
      select id from public.badge_definitions where source = 'manual'
    )
  );

-- Recomputes p_user_id's accepted-match total (as either student or
-- mentor) and inserts any not-yet-awarded match_count badge whose
-- threshold it now meets. Safe to call repeatedly (on conflict do nothing).
create or replace function public.award_match_count_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.match_requests
  where status = 'accepted'
    and (student_id = p_user_id or mentor_id = p_user_id);

  insert into public.user_badges (user_id, badge_definition_id)
  select p_user_id, bd.id
  from public.badge_definitions bd
  where bd.source = 'match_count' and bd.threshold <= v_count
  on conflict (user_id, badge_definition_id) do nothing;
end;
$$;

create or replace function public.award_match_count_badges_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_match_count_badges(new.student_id);
  perform public.award_match_count_badges(new.mentor_id);
  return new;
end;
$$;

-- match_requests' enforce_match_request_update trigger (migration 0001,
-- extended in 0010/0014) guarantees 'accepted' is never left once entered
-- (the only path onward is 'completed'), so this fires at most once per
-- request and never needs to un-award anything.
create trigger match_requests_award_badges
  after update of status on public.match_requests
  for each row
  when (new.status = 'accepted' and old.status is distinct from 'accepted')
  execute function public.award_match_count_badges_on_accept();
