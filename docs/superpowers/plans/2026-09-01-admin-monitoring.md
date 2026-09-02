# 管理者モニタリング機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理者が全体の統計（ユーザー数・申請状況・メッセージ数）とユーザー一覧・個別詳細を閲覧できる、読み取り専用の管理画面を追加する。

**Architecture:** 既存の `app/(dashboard)` とは別の `app/admin` セクションを新設する。認可はこのアプリが一貫して使ってきたRLSベースのモデルを踏襲し、`is_admin()` というSQL関数でRLSポリシーを拡張する（サービスロールキーは導入しない）。各データ取得関数は既存の `fetchMentors` / `fetchMatchRequests` と同じ「pure builder + async fetcher」パターンに従う。

**Tech Stack:** Next.js App Router (Server Components), Supabase (Postgres, RLS), Vitest, Tailwind CSS v4（既存の warm テーマトークン: `bg-background` `text-foreground` `text-muted` `bg-surface` `border-border` `bg-primary` `text-primary-foreground`）

**Spec:** `docs/superpowers/specs/2026-09-01-admin-monitoring-design.md`

## Global Constraints

- 認可はRLSのみで行う。サービスロールキーやそれに類する特権クレデンシャルは導入しない。
- メールアドレス（`auth.users`）は一切表示しない。
- 最初のadminユーザーはSQLで手動作成する。アプリ内でのadmin昇格UIは作らない。
- ユーザー・申請・メッセージの削除やモデレーション機能はスコープ外。読み取りのみ。
- 既存のTailwindトークン（`app/globals.css` の `@theme inline` で定義済み）以外の新しい色は導入しない。
- すべてのタスクの完了時に `npx vitest run`、`npx tsc --noEmit`、`npm run lint` がクリアであること。

---

### Task 1: `is_admin()` とRLSポリシーの拡張（マイグレーション）

**Files:**
- Create: `supabase/migrations/0008_admin_rls.sql`
- Test: `supabase/migrations/0008_admin_rls.test.ts`

**Interfaces:**
- Consumes: なし（既存の `public.profiles`, `public.match_requests`, `public.messages` テーブルとその既存RLSポリシー。参考: `supabase/migrations/0001_init.sql` の該当ポリシー定義、`supabase/migrations/0005_rls_performance_and_indexes.sql` の書き方）
- Produces: `public.is_admin()` というSQL関数（他のタスクはこれを直接呼ばない。RLSポリシー経由でのみ使われる）

- [ ] **Step 1: 失敗するテストを書く**

`supabase/migrations/0008_admin_rls.test.ts` を作成:

```ts
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0008_admin_rls.sql'),
  'utf-8'
).toLowerCase();

describe('0008_admin_rls.sql', () => {
  it('creates an is_admin() security definer function scoped to the caller', () => {
    expect(sql).toContain('create or replace function public.is_admin()');
    expect(sql).toContain('security definer');
    expect(sql).toContain("where id = auth.uid() and role = 'admin'");
  });

  it('lets admins read every match_requests row alongside participants', () => {
    expect(sql).toContain('drop policy "match_requests_select_participant"');
    expect(sql).toContain('create policy "match_requests_select_participant"');
    const matchRequestsPolicyIndex = sql.indexOf(
      'create policy "match_requests_select_participant"'
    );
    const matchRequestsPolicySnippet = sql.slice(
      matchRequestsPolicyIndex,
      matchRequestsPolicyIndex + 400
    );
    expect(matchRequestsPolicySnippet).toContain('or public.is_admin()');
  });

  it('lets admins read every messages row alongside participants', () => {
    expect(sql).toContain('drop policy "messages_select_participant"');
    expect(sql).toContain('create policy "messages_select_participant"');
    const messagesPolicyIndex = sql.indexOf(
      'create policy "messages_select_participant"'
    );
    const messagesPolicySnippet = sql.slice(messagesPolicyIndex);
    expect(messagesPolicySnippet).toContain('or public.is_admin()');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx vitest run supabase/migrations/0008_admin_rls.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open '.../0008_admin_rls.sql'`

- [ ] **Step 3: マイグレーションSQLを書く**

`supabase/migrations/0008_admin_rls.sql` を作成:

```sql
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npx vitest run supabase/migrations/0008_admin_rls.test.ts`
Expected: PASS（3テストとも）

- [ ] **Step 5: コミット**

```bash
git add supabase/migrations/0008_admin_rls.sql supabase/migrations/0008_admin_rls.test.ts
git commit -m "feat: let admins read all match requests and messages via RLS

Adds is_admin() and extends the match_requests/messages select policies
with an admin bypass, so the upcoming admin monitoring screens can query
under the admin's own session instead of a service-role client."
```

---

### Task 2: `requireAdmin()` ガードヘルパー

**Files:**
- Create: `lib/auth/require-admin.ts`
- Test: `lib/auth/require-admin.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser()` と `CurrentUser` 型（`lib/auth/get-current-user.ts`）、`createClient()`（`lib/supabase/server.ts`）
- Produces: `requireAdmin(): Promise<CurrentUser>` — Task 3 以降の `app/admin/**` 配下のページ/レイアウトがこれを呼ぶ

- [ ] **Step 1: 失敗するテストを書く**

`lib/auth/require-admin.test.ts` を作成:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, redirectMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import { requireAdmin } from './require-admin';

function mockProfileRole(role: string | null) {
  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: role ? { role } : null }),
      }),
    }),
  });
}

describe('requireAdmin', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    redirectMock.mockClear();
  });

  it('redirects to /login when nobody is signed in, without querying profiles', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('redirects to /home when the signed-in user is not an admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com' });
    mockProfileRole('student');

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/home');
  });

  it('redirects to /home when the profile row is missing entirely', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com' });
    mockProfileRole(null);

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/home');
  });

  it('returns the current user when they are an admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' });
    mockProfileRole('admin');

    const result = await requireAdmin();

    expect(result).toEqual({ id: 'admin-1', email: 'admin@example.com' });
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx vitest run lib/auth/require-admin.test.ts`
Expected: FAIL — `Cannot find module './require-admin'`

- [ ] **Step 3: 実装を書く**

`lib/auth/require-admin.ts` を作成:

```ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, type CurrentUser } from './get-current-user';

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/home');
  }

  return user;
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npx vitest run lib/auth/require-admin.test.ts`
Expected: PASS（4テストとも）

- [ ] **Step 5: 型チェック・lintを実行する**

Run: `npx tsc --noEmit && npm run lint`
Expected: どちらもエラーなし

- [ ] **Step 6: コミット**

```bash
git add lib/auth/require-admin.ts lib/auth/require-admin.test.ts
git commit -m "feat: add requireAdmin() guard for the upcoming admin section"
```

---

### Task 3: 管理画面レイアウト（ガード + ナビ）

**Files:**
- Create: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `requireAdmin()`（Task 2, `lib/auth/require-admin.ts`）
- Produces: `app/admin/**` 配下のすべてのページに適用されるガード付きレイアウト。以降のタスクのページコンポーネントは自分自身で `requireAdmin()` を呼ぶ必要はない（レイアウトが先に実行される）。

- [ ] **Step 1: レイアウトを書く**

`app/admin/layout.tsx` を作成:

```tsx
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '概要' },
  { href: '/admin/users', label: 'ユーザー一覧' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-surface p-4">
        <span className="font-bold text-primary">管理者画面</span>
        <nav className="flex items-center gap-4">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-foreground">
              {item.label}
            </Link>
          ))}
          <Link href="/home" className="text-sm text-muted">
            アプリに戻る
          </Link>
        </nav>
      </header>
      <div className="p-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: 型チェックを実行する（この時点ではまだ子ページが無いのでビルドは通らない。tscのみ確認）**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add the admin section layout and nav"
```

---

### Task 4: 概要ページ（統計カード）

**Files:**
- Create: `app/admin/get-admin-stats.ts`
- Create: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `createClient()`（`lib/supabase/server.ts`）
- Produces: `fetchAdminStats(supabase): Promise<AdminStats>`。他のタスクはこれを使わない（概要ページ専用）。

- [ ] **Step 1: データ取得関数を書く（このファイルはテスト対象外 — `app/(dashboard)/mentors/get-mentors.ts` の `fetchMentors` と同じ「単純なカウントクエリのラッパー」のため、既存の方針を踏襲してユニットテストは書かない）**

`app/admin/get-admin-stats.ts` を作成:

```ts
import type { createClient } from '@/lib/supabase/server';

export interface AdminStats {
  studentCount: number;
  mentorCount: number;
  pendingRequestCount: number;
  acceptedRequestCount: number;
  rejectedRequestCount: number;
  messageCount: number;
}

export async function fetchAdminStats(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminStats> {
  const [
    { count: studentCount },
    { count: mentorCount },
    { count: pendingRequestCount },
    { count: acceptedRequestCount },
    { count: rejectedRequestCount },
    { count: messageCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
  ]);

  return {
    studentCount: studentCount ?? 0,
    mentorCount: mentorCount ?? 0,
    pendingRequestCount: pendingRequestCount ?? 0,
    acceptedRequestCount: acceptedRequestCount ?? 0,
    rejectedRequestCount: rejectedRequestCount ?? 0,
    messageCount: messageCount ?? 0,
  };
}
```

- [ ] **Step 2: 概要ページを書く**

`app/admin/page.tsx` を作成:

```tsx
import { createClient } from '@/lib/supabase/server';
import { fetchAdminStats } from './get-admin-stats';

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const stats = await fetchAdminStats(supabase);

  const cards = [
    { label: '学生数', value: stats.studentCount },
    { label: 'メンター数', value: stats.mentorCount },
    { label: '審査中の申請', value: stats.pendingRequestCount },
    { label: '承認済みの申請', value: stats.acceptedRequestCount },
    { label: '却下された申請', value: stats.rejectedRequestCount },
    { label: '総メッセージ数', value: stats.messageCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">概要</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: テスト・型チェック・lint・ビルドを実行する**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npx next build`
Expected: すべて成功。`next build` の出力に `/admin` が `ƒ`（動的）ルートとして表示される。

- [ ] **Step 4: コミット**

```bash
git add app/admin/get-admin-stats.ts app/admin/page.tsx
git commit -m "feat: add the admin overview page with stat cards"
```

---

### Task 5: ユーザー一覧ページ

**Files:**
- Create: `app/admin/users/get-admin-users.ts`
- Create: `app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `createClient()`（`lib/supabase/server.ts`）、`ProfileRole` 型（`@/types/database`）
- Produces: `fetchAllUsers(supabase, roleFilter?): Promise<AdminUserRow[]>`。他のタスクは使わない。

- [ ] **Step 1: データ取得関数を書く（テスト対象外 — Task 4 と同じ理由）**

`app/admin/users/get-admin-users.ts` を作成:

```ts
import type { createClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/types/database';

export interface AdminUserRow {
  id: string;
  name: string;
  role: ProfileRole;
  createdAt: string;
}

export async function fetchAllUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleFilter?: ProfileRole
): Promise<AdminUserRow[]> {
  let query = supabase
    .from('profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: false });

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  }));
}
```

- [ ] **Step 2: 一覧ページを書く**

`app/admin/users/page.tsx` を作成:

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllUsers } from './get-admin-users';
import type { ProfileRole } from '@/types/database';

const ROLE_LABELS: Record<ProfileRole, string> = {
  student: '学生',
  mentor: 'メンター',
  admin: '管理者',
};

const ROLE_OPTIONS: ProfileRole[] = ['student', 'mentor', 'admin'];

function isProfileRole(value: string | undefined): value is ProfileRole {
  return value === 'student' || value === 'mentor' || value === 'admin';
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const roleFilter = isProfileRole(role) ? role : undefined;

  const supabase = await createClient();
  const users = await fetchAllUsers(supabase, roleFilter);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">ユーザー一覧</h1>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/users"
          className={`rounded-full border px-3 py-1 text-sm transition ${
            !roleFilter
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground hover:bg-surface'
          }`}
        >
          すべて
        </Link>
        {ROLE_OPTIONS.map((r) => (
          <Link
            key={r}
            href={`/admin/users?role=${r}`}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              roleFilter === r
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:bg-surface'
            }`}
          >
            {ROLE_LABELS[r]}
          </Link>
        ))}
      </nav>

      {users.length === 0 ? (
        <p className="text-sm text-muted">該当するユーザーがいません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary"
              >
                <span className="font-bold text-foreground">{user.name}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {ROLE_LABELS[user.role]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: テスト・型チェック・lint・ビルドを実行する**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npx next build`
Expected: すべて成功。`/admin/users` が動的ルートとして表示される。

- [ ] **Step 4: コミット**

```bash
git add app/admin/users/get-admin-users.ts app/admin/users/page.tsx
git commit -m "feat: add the admin user list page with a role filter"
```

---

### Task 6: 個別ユーザー詳細ページ

**Files:**
- Create: `app/admin/users/[id]/get-user-detail.ts`
- Test: `app/admin/users/[id]/get-user-detail.test.ts`
- Create: `app/admin/users/[id]/page.tsx`

**Interfaces:**
- Consumes: `createClient()`（`lib/supabase/server.ts`）、`ProfileRole` 型（`@/types/database`）、`fetchMatchRequests(supabase, userId): Promise<MatchRequestSummary[]>`（`@/app/(dashboard)/requests/get-requests`。`MatchRequestSummary` は `{ id, status, message, createdAt, counterpartName, category: { key, label }, isMentor }` の形）
- Produces: `buildUserDetail(profile, messageCount): UserDetail`（テスト対象）、`fetchUserDetail(supabase, userId): Promise<UserDetail | null>`

- [ ] **Step 1: 失敗するテストを書く（純粋関数 `buildUserDetail` のみ。`fetchUserDetail` 自体は他の `fetch*` 関数と同じ理由でテスト対象外）**

`app/admin/users/[id]/get-user-detail.test.ts` を作成:

```ts
import { describe, expect, it } from 'vitest';
import { buildUserDetail } from './get-user-detail';

describe('buildUserDetail', () => {
  it('combines the profile row and message count into a UserDetail', () => {
    const result = buildUserDetail(
      {
        id: 'user-1',
        name: 'タロウ',
        role: 'mentor',
        bio: 'よろしくお願いします',
        created_at: '2026-08-01T00:00:00Z',
      },
      5
    );

    expect(result).toEqual({
      id: 'user-1',
      name: 'タロウ',
      role: 'mentor',
      bio: 'よろしくお願いします',
      createdAt: '2026-08-01T00:00:00Z',
      messageCount: 5,
    });
  });

  it('keeps a message count of zero rather than treating it as missing', () => {
    const result = buildUserDetail(
      {
        id: 'user-2',
        name: 'ハナコ',
        role: 'student',
        bio: '',
        created_at: '2026-08-02T00:00:00Z',
      },
      0
    );

    expect(result.messageCount).toBe(0);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx vitest run "app/admin/users/[id]/get-user-detail.test.ts"`
Expected: FAIL — `Cannot find module './get-user-detail'`

- [ ] **Step 3: データ取得関数を書く**

`app/admin/users/[id]/get-user-detail.ts` を作成:

```ts
import type { createClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/types/database';

export interface UserDetail {
  id: string;
  name: string;
  role: ProfileRole;
  bio: string;
  createdAt: string;
  messageCount: number;
}

export interface UserProfileRow {
  id: string;
  name: string;
  role: ProfileRole;
  bio: string;
  created_at: string;
}

export function buildUserDetail(profile: UserProfileRow, messageCount: number): UserDetail {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    createdAt: profile.created_at,
    messageCount,
  };
}

export async function fetchUserDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserDetail | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, bio, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId);

  return buildUserDetail(profile as UserProfileRow, count ?? 0);
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npx vitest run "app/admin/users/[id]/get-user-detail.test.ts"`
Expected: PASS（2テストとも）

- [ ] **Step 5: 詳細ページを書く**

`app/admin/users/[id]/page.tsx` を作成:

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchUserDetail } from './get-user-detail';
import { fetchMatchRequests } from '@/app/(dashboard)/requests/get-requests';
import type { ProfileRole, MatchRequestStatus } from '@/types/database';

const ROLE_LABELS: Record<ProfileRole, string> = {
  student: '学生',
  mentor: 'メンター',
  admin: '管理者',
};

const STATUS_LABELS: Record<MatchRequestStatus, string> = {
  pending: '審査中',
  accepted: '承認済み',
  rejected: '却下',
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const detail = await fetchUserDetail(supabase, id);

  if (!detail) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">ユーザー詳細</h1>
        <p className="mt-2 text-sm text-muted">見つかりません</p>
      </div>
    );
  }

  const requests = await fetchMatchRequests(supabase, id);
  const asStudent = requests.filter((r) => !r.isMentor);
  const asMentor = requests.filter((r) => r.isMentor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/users" className="text-sm text-primary underline">
          ← ユーザー一覧へ
        </Link>
        <h1 className="mt-2 text-xl font-bold text-foreground">{detail.name}</h1>
        <p className="text-sm text-muted">
          {ROLE_LABELS[detail.role]} ・ 登録日:{' '}
          {new Date(detail.createdAt).toLocaleDateString('ja-JP')}
        </p>
        {detail.bio && <p className="mt-2 text-sm text-foreground">{detail.bio}</p>}
        <p className="mt-2 text-sm text-muted">送信メッセージ数: {detail.messageCount}</p>
      </div>

      <div>
        <h2 className="font-bold text-foreground">学生として申請した分 ({asStudent.length})</h2>
        {asStudent.length === 0 ? (
          <p className="mt-1 text-sm text-muted">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {asStudent.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                {r.counterpartName} ・ {r.category.label} ・ {STATUS_LABELS[r.status]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-bold text-foreground">メンターとして受けた分 ({asMentor.length})</h2>
        {asMentor.length === 0 ? (
          <p className="mt-1 text-sm text-muted">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {asMentor.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                {r.counterpartName} ・ {r.category.label} ・ {STATUS_LABELS[r.status]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: テスト・型チェック・lint・ビルドを実行する**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npx next build`
Expected: すべて成功。`/admin/users/[id]` が動的ルートとして表示される。

- [ ] **Step 7: コミット**

```bash
git add "app/admin/users/[id]/get-user-detail.ts" "app/admin/users/[id]/get-user-detail.test.ts" "app/admin/users/[id]/page.tsx"
git commit -m "feat: add the admin user detail page

Reuses fetchMatchRequests from the requests screen — passing the
inspected user's id in place of the current user's id — instead of
writing a second query for the same shape of data."
```

---

### Task 7: マイグレーション適用・adminユーザー作成・実機確認

このタスクはコードを書かない。ローカルの変更をSupabaseプロジェクトに反映し、実際に動作確認する。

**Files:** なし（Supabase MCPツール、またはSupabase CLI/ダッシュボード経由でのDB操作のみ）

- [ ] **Step 1: `0008_admin_rls.sql` の内容を対象のSupabaseプロジェクトに適用する**

Task 1で作成した `supabase/migrations/0008_admin_rls.sql` の内容をそのまま実行する
（このプロジェクトはこれまでSupabase MCPの `apply_migration` ツールでリモートに直接適用してきた運用なので、それに従う）。

- [ ] **Step 2: 適用結果を確認する**

以下のSQLを実行し、`is_admin` 関数が存在すること、両ポリシーが `is_admin()` を含むことを確認する:

```sql
select proname from pg_proc where proname = 'is_admin';

select polname, qual from pg_policies
where tablename in ('match_requests', 'messages')
and polname in ('match_requests_select_participant', 'messages_select_participant');
```

- [ ] **Step 3: 既存ユーザーの1人をadminに昇格する**

動作確認用に、自分（またはテスト用）のプロフィールIDを指定して実行:

```sql
update public.profiles set role = 'admin' where id = '<対象のprofiles.id>';
```

- [ ] **Step 4: devサーバーを起動し、そのアカウントで実際にログインしてブラウザで確認する**

確認項目:
- `/admin` にアクセスして概要の統計カードが表示される（学生数・メンター数・申請ステータス別件数・総メッセージ数が実際のデータと一致する）
- `/admin/users` でユーザー一覧が表示され、ロールで絞り込める
- `/admin/users/[id]` で個別ユーザーの詳細（プロフィール・申請一覧・メッセージ数）が表示される
- adminでない一般ユーザー（学生/メンター）でログインした状態で `/admin` にアクセスすると `/home` にリダイレクトされる
- 未ログイン状態で `/admin` にアクセスすると `/login` にリダイレクトされる

- [ ] **Step 5: 発見した問題があれば、対応するタスクに戻って修正する（このステップは問題が無ければスキップ）**

---

### Task 8: README追記と最終確認

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: なし
- Produces: なし（ドキュメントのみ）

- [ ] **Step 1: README に管理画面の説明を追記する**

`README.md` の末尾（または既存の「開発中にログインをスキップする」節の後）に追記:

```markdown
### 管理画面

`/admin` 以下に、学生数・メンター数・マッチング申請の状況・総メッセージ数を見られる
読み取り専用の管理画面があります。ユーザーの削除やモデレーション機能はありません。

admin権限はアプリの画面からは付与できません。SQLで直接プロフィールのroleを
書き換えてください。

```sql
update public.profiles set role = 'admin' where id = '<対象のprofiles.id>';
```
```

- [ ] **Step 2: 全体の最終確認を行う**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npx next build`
Expected: すべて成功

- [ ] **Step 3: コミット**

```bash
git add README.md
git commit -m "docs: document the admin section and how to grant admin access"
```

---

## Self-Review Notes

- **Spec coverage:** §3.1(admin判定)→Task7 Step3、§3.2(RLS)→Task1、§3.3(ガード)→Task2, 3、§4.1(概要)→Task4、§4.2(一覧)→Task5、§4.3(詳細、`fetchMatchRequests`再利用を含む)→Task6、§5(エラー処理)→Task2/3(未ログイン・非admin)とTask6(見つからない場合)、§6(テスト方針)→各タスクのテスト方針に反映。すべて対応するタスクあり。
- **Placeholder scan:** 「TODO」「適切なエラー処理を追加」等のプレースホルダーなし。全ステップに実コードあり。
- **Type consistency:** `AdminStats`(Task4)、`AdminUserRow`(Task5)、`UserDetail`/`UserProfileRow`(Task6)の型はそれぞれのタスク内で閉じており、他タスクとの命名衝突なし。`fetchMatchRequests`の戻り値型`MatchRequestSummary`（`isMentor`, `counterpartName`, `category.label`, `status`）はTask6のpage.tsxで使用している通りの形（`app/(dashboard)/requests/get-requests.ts`の既存実装と一致）。`ProfileRole`は`@/types/database`から一貫して参照。
