-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'mentor', 'admin')),
  name text not null,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories: fixed master data (4 rows)
create table public.categories (
  id serial primary key,
  key text not null unique,
  label text not null
);

insert into public.categories (key, label) values
  ('career', 'キャリア相談'),
  ('skill', 'スキル/技術メンタリング'),
  ('project', 'プロジェクト支援'),
  ('academic', '学業/研究支援');

-- mentor_categories: which categories a mentor supports
create table public.mentor_categories (
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  category_id int not null references public.categories(id) on delete cascade,
  primary key (mentor_id, category_id)
);

-- match_requests: student -> mentor matching applications
create table public.match_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  category_id int not null references public.categories(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- messages: chat messages on an accepted match_request
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.mentor_categories enable row level security;
alter table public.match_requests enable row level security;
alter table public.messages enable row level security;

-- profiles policies
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- categories policies (read-only master data)
create policy "categories_select_authenticated" on public.categories
  for select to authenticated using (true);

-- mentor_categories policies
create policy "mentor_categories_select_authenticated" on public.mentor_categories
  for select to authenticated using (true);

create policy "mentor_categories_insert_own" on public.mentor_categories
  for insert to authenticated with check (auth.uid() = mentor_id);

create policy "mentor_categories_delete_own" on public.mentor_categories
  for delete to authenticated using (auth.uid() = mentor_id);

-- match_requests policies
create policy "match_requests_select_participant" on public.match_requests
  for select to authenticated using (auth.uid() = student_id or auth.uid() = mentor_id);

create policy "match_requests_insert_student" on public.match_requests
  for insert to authenticated with check (auth.uid() = student_id);

create policy "match_requests_update_participant" on public.match_requests
  for update to authenticated using (auth.uid() = student_id or auth.uid() = mentor_id);

-- messages policies
create policy "messages_select_participant" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and (mr.student_id = auth.uid() or mr.mentor_id = auth.uid())
    )
  );

create policy "messages_insert_accepted_participant" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.match_requests mr
      where mr.id = messages.match_id
        and mr.status = 'accepted'
        and (mr.student_id = auth.uid() or mr.mentor_id = auth.uid())
    )
  );
