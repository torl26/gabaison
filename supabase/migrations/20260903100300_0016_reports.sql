-- Reports: lets a user flag another user's profile for admin review.
-- Immutable audit trail, like reviews (migration 0014) — no update or
-- delete policy, and no select policy for the reporter themselves.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (
    reason in ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')
  ),
  created_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_id)
);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "reports_select_admin" on public.reports
  for select to authenticated
  using ((select public.is_admin()));
