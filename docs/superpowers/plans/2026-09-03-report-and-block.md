# 通報・ブロック機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 相手のプロフィール画面から通報・ブロックができるようにし、ブロックの効果（申請/チャット停止・一覧非表示・プロフィール非表示・既存マッチングの自動終了）と、通報の管理者確認画面を実装する。

**Architecture:** RLSベースの認可のみで実現する（service role keyは使わない、このプロジェクトの一貫した方針）。`blocks`/`reports` の2テーブルを追加し、`is_blocked()` ヘルパー関数を既存の `profiles`/`match_requests` のRLSポリシーに組み込むことで、ブロックの効果をアプリコード側の分岐なしに自然に実現する。既存の「見つかりません」表示パターンを再利用する。

**Tech Stack:** Next.js (App Router, Server Components + Server Actions), Supabase (Postgres + RLS), Zod, Vitest。

**Spec:** `docs/superpowers/specs/2026-09-03-report-and-block-design.md`

## Global Constraints

- service role keyやSQL直接実行を伴わない、通常のユーザーセッション + RLS のみで認可する
- 通報理由は選択式のみ（自由記述コメントなし）
- ブロックは一方向に保存するが、効果（申請・閲覧の制限）は双方向に働く
- ブロック時、既存の `pending`/`accepted` なマッチングは自動で `cancelled` にする
- 通報・ブロックの操作は `lib/actions/types.ts` の `ActionResult` 型を返す既存パターンに従う
- マイグレーションファイル名は `<timestamp>_00NN_<name>.sql` 形式（`supabase/migrations/` の既存ファイルと同じ命名規則）

---

## Task 1: `blocks` テーブルとブロックの効果（RLS）

**Files:**
- Create: `supabase/migrations/20260903100200_0015_blocks.sql`
- Test: `supabase/migrations/20260903100200_0015_blocks.test.ts`

**Interfaces:**
- Consumes: 既存の `public.is_admin()` 関数（`supabase/migrations/20260902054813_0008_admin_rls.sql`）、既存の `public.enforce_match_request_update()` 関数の全文（`supabase/migrations/20260903100100_0014_reviews.sql`）
- Produces: `public.blocks` テーブル、`public.is_blocked(a uuid, b uuid) returns boolean`、`public.get_blocked_profiles() returns table(id uuid, name text, avatar_url text, blocked_at timestamptz)`。以降のタスクはこれらをそのまま使う。

- [ ] **Step 1: マイグレーションSQLを書く**

`supabase/migrations/20260903100200_0015_blocks.sql`:

```sql
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
```

- [ ] **Step 2: マイグレーションのテストを書く**

`supabase/migrations/20260903100200_0015_blocks.test.ts`:

```ts
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260903100200_0015_blocks.sql'),
  'utf-8'
).toLowerCase();

describe('20260903100200_0015_blocks.sql', () => {
  it('creates the blocks table with a self-block check', () => {
    expect(sql).toContain('create table public.blocks');
    expect(sql).toContain('constraint blocks_not_self check (blocker_id <> blocked_id)');
  });

  it('enables RLS on blocks scoped to the blocker', () => {
    expect(sql).toContain('alter table public.blocks enable row level security');
    expect(sql).toContain('using (blocker_id = (select auth.uid()))');
    expect(sql).toContain('with check (blocker_id = (select auth.uid()))');
  });

  it('defines is_blocked as a bidirectional, security definer check', () => {
    expect(sql).toContain('create or replace function public.is_blocked(a uuid, b uuid)');
    expect(sql).toContain('security definer');
    expect(sql).toContain(
      'where (blocker_id = a and blocked_id = b)\n       or (blocker_id = b and blocked_id = a)'
    );
  });

  it('defines get_blocked_profiles scoped to the calling user', () => {
    expect(sql).toContain('create or replace function public.get_blocked_profiles()');
    expect(sql).toContain('where b.blocker_id = (select auth.uid())');
  });

  it('hides a blocked counterpart from profiles select, unless admin or self', () => {
    expect(sql).toContain('drop policy "profiles_select_authenticated" on public.profiles');
    expect(sql).toContain('or public.is_admin()');
    expect(sql).toContain('or not public.is_blocked(id, (select auth.uid()))');
  });

  it('blocks new match requests between blocked pairs', () => {
    expect(sql).toContain('drop policy "match_requests_insert_student" on public.match_requests');
    expect(sql).toContain('and not public.is_blocked(student_id, mentor_id)');
  });

  it('allows a block-triggered forced cancellation regardless of caller role', () => {
    expect(sql).toContain(
      "if new.status = 'cancelled' and public.is_blocked(old.student_id, old.mentor_id) then"
    );
  });

  it('cancels pending or accepted matches on block insert via a trigger', () => {
    expect(sql).toContain('create or replace function public.cancel_matches_on_block()');
    expect(sql).toContain("where status in ('pending', 'accepted')");
    expect(sql).toContain('create trigger on_block_cancel_matches');
    expect(sql).toContain('after insert on public.blocks');
  });
});
```

- [ ] **Step 3: テストを実行して通ることを確認する**

Run: `npm run test -- blocks.test.ts`
Expected: PASS（8件）

- [ ] **Step 4: コミット**

```bash
git add supabase/migrations/20260903100200_0015_blocks.sql supabase/migrations/20260903100200_0015_blocks.test.ts
git commit -m "feat: add blocks table and enforce block effects via RLS"
```

---

## Task 2: `reports` テーブル

**Files:**
- Create: `supabase/migrations/20260903100300_0016_reports.sql`
- Test: `supabase/migrations/20260903100300_0016_reports.test.ts`

**Interfaces:**
- Consumes: 既存の `public.is_admin()`（Task 1と同じ）
- Produces: `public.reports` テーブル（列: `id, reporter_id, reported_id, reason, created_at`）。Task 5, 6, 11 がこの列名を使う。

- [ ] **Step 1: マイグレーションSQLを書く**

`supabase/migrations/20260903100300_0016_reports.sql`:

```sql
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
  using (public.is_admin());
```

- [ ] **Step 2: マイグレーションのテストを書く**

`supabase/migrations/20260903100300_0016_reports.test.ts`:

```ts
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260903100300_0016_reports.sql'),
  'utf-8'
).toLowerCase();

describe('20260903100300_0016_reports.sql', () => {
  it('creates the reports table with a fixed reason enum and a self-report check', () => {
    expect(sql).toContain('create table public.reports');
    expect(sql).toContain(
      "reason in ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')"
    );
    expect(sql).toContain('constraint reports_not_self check (reporter_id <> reported_id)');
  });

  it('enables RLS with insert-own and admin-only select', () => {
    expect(sql).toContain('alter table public.reports enable row level security');
    expect(sql).toContain('with check (reporter_id = (select auth.uid()))');
    expect(sql).toContain('using (public.is_admin())');
  });

  it('has no update or delete policy', () => {
    expect(sql).not.toContain('for update');
    expect(sql).not.toContain('for delete');
  });
});
```

- [ ] **Step 3: テストを実行して通ることを確認する**

Run: `npm run test -- reports.test.ts`
Expected: PASS（3件）

- [ ] **Step 4: コミット**

```bash
git add supabase/migrations/20260903100300_0016_reports.sql supabase/migrations/20260903100300_0016_reports.test.ts
git commit -m "feat: add reports table for admin review"
```

---

## Task 3: 通報理由の定数

**Files:**
- Create: `lib/constants/report-reasons.ts`
- Test: `lib/constants/report-reasons.test.ts`

**Interfaces:**
- Produces: `REPORT_REASON_KEYS: readonly ['spam', 'harassment', 'inappropriate_content', 'impersonation', 'other']`, `type ReportReason`, `REPORT_REASON_LABELS: Record<ReportReason, string>`。Task 4（バリデーション）、Task 8（通報ボタン）、Task 11（管理画面）が使う。

- [ ] **Step 1: 定数ファイルを書く**

`lib/constants/report-reasons.ts`:

```ts
export const REPORT_REASON_KEYS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'impersonation',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASON_KEYS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'スパム',
  harassment: '迷惑行為・嫌がらせ',
  inappropriate_content: '不適切な内容',
  impersonation: 'なりすまし',
  other: 'その他',
};
```

- [ ] **Step 2: テストを書く**

`lib/constants/report-reasons.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REPORT_REASON_KEYS, REPORT_REASON_LABELS } from './report-reasons';

describe('report reasons', () => {
  it('has exactly the five fixed reason keys, in order', () => {
    expect(REPORT_REASON_KEYS).toEqual([
      'spam',
      'harassment',
      'inappropriate_content',
      'impersonation',
      'other',
    ]);
  });

  it('has a non-empty label for every reason key', () => {
    for (const key of REPORT_REASON_KEYS) {
      expect(REPORT_REASON_LABELS[key].length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: テストを実行して通ることを確認する**

Run: `npm run test -- report-reasons.test.ts`
Expected: PASS（2件）

- [ ] **Step 4: コミット**

```bash
git add lib/constants/report-reasons.ts lib/constants/report-reasons.test.ts
git commit -m "feat: add report reason constants"
```

---

## Task 4: 通報・ブロックのバリデーションスキーマ

**Files:**
- Create: `lib/validations/block.ts`
- Create: `lib/validations/report.ts`
- Test: `lib/validations/report.test.ts`

**Interfaces:**
- Consumes: `REPORT_REASON_KEYS` from Task 3 (`lib/constants/report-reasons.ts`)
- Produces: `blockUserSchema: z.ZodObject<{ blockedId: ... }>`（`{ blockedId: string }` を検証。block/unblock 両方のactionで使う）, `reportUserSchema: z.ZodObject<{ reportedId: ..., reason: ... }>`（`{ reportedId: string, reason: ReportReason }` を検証）。Task 6, 7 が使う。

- [ ] **Step 1: `block.ts` を書く（既存の `cancel-request.ts` と同じ単純な形なのでテストは書かない）**

`lib/validations/block.ts`:

```ts
import { z } from 'zod';

export const blockUserSchema = z.object({
  blockedId: z.uuid(),
});
```

- [ ] **Step 2: `report.ts` の失敗するテストを書く**

`lib/validations/report.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { reportUserSchema } from './report';

const REPORTED_ID = '11111111-1111-4111-8111-111111111111';

describe('reportUserSchema', () => {
  it('accepts a valid reason', () => {
    const result = reportUserSchema.safeParse({
      reportedId: REPORTED_ID,
      reason: 'spam',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid reportedId', () => {
    const result = reportUserSchema.safeParse({
      reportedId: 'not-a-uuid',
      reason: 'spam',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown reason', () => {
    const result = reportUserSchema.safeParse({
      reportedId: REPORTED_ID,
      reason: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: テストを実行して失敗することを確認する**

Run: `npm run test -- lib/validations/report.test.ts`
Expected: FAIL（`./report` が存在しない）

- [ ] **Step 4: `report.ts` を実装する**

`lib/validations/report.ts`:

```ts
import { z } from 'zod';
import { REPORT_REASON_KEYS } from '@/lib/constants/report-reasons';

export const reportUserSchema = z.object({
  reportedId: z.uuid(),
  reason: z.enum(REPORT_REASON_KEYS, { message: '通報理由を選択してください' }),
});
```

- [ ] **Step 5: テストを実行して通ることを確認する**

Run: `npm run test -- lib/validations/report.test.ts`
Expected: PASS（3件）

- [ ] **Step 6: コミット**

```bash
git add lib/validations/block.ts lib/validations/report.ts lib/validations/report.test.ts
git commit -m "feat: add block and report validation schemas"
```

---

## Task 5: ブロック用 Server Actions

**Files:**
- Create: `app/(dashboard)/profile/block-actions.ts`
- Test: `app/(dashboard)/profile/block-actions.test.ts`

**Interfaces:**
- Consumes: `blockUserSchema` from Task 4 (`lib/validations/block.ts`), `getCurrentUser` (`lib/auth/get-current-user.ts`), `ActionResult`/`ok`/`err` (`lib/actions/types.ts`), `public.blocks` table from Task 1
- Produces: `blockUserAction(prevState, formData): Promise<ActionResult<void>>`, `unblockUserAction(prevState, formData): Promise<ActionResult<void>>`。どちらも `FormData` に `blockedId` を要求する。Task 8, 9 が使う。

- [ ] **Step 1: 失敗するテストを書く**

`app/(dashboard)/profile/block-actions.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, insertMock, deleteMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { blockUserAction, unblockUserAction } from './block-actions';

const BLOCKED_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('blockUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
    deleteMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a blocks row with the current user as blocker', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(fromMock).toHaveBeenCalledWith('blocks');
    expect(insertMock).toHaveBeenCalledWith({
      blocker_id: 'user-1',
      blocked_id: BLOCKED_ID,
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns a friendly message on a duplicate block', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result).toEqual({ success: false, error: 'すでにブロック済みです' });
  });

  it('returns an error on other insert failures', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '500', message: 'boom' } });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result.success).toBe(false);
  });
});

describe('unblockUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    deleteMock.mockReset();
  });

  it('deletes the blocks row scoped to the current user as blocker', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    const eqBlockerMock = vi.fn();
    const eqBlockedMock = vi.fn().mockResolvedValue({ error: null });
    eqBlockerMock.mockReturnValue({ eq: eqBlockedMock });
    deleteMock.mockReturnValue({ eq: eqBlockerMock });
    fromMock.mockReturnValue({ delete: deleteMock });

    const result = await unblockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(fromMock).toHaveBeenCalledWith('blocks');
    expect(eqBlockerMock).toHaveBeenCalledWith('blocker_id', 'user-1');
    expect(eqBlockedMock).toHaveBeenCalledWith('blocked_id', BLOCKED_ID);
    expect(result).toEqual({ success: true, data: undefined });
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

Run: `npm run test -- block-actions.test.ts`
Expected: FAIL（`./block-actions` が存在しない）

- [ ] **Step 3: 実装する**

`app/(dashboard)/profile/block-actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { blockUserSchema } from '@/lib/validations/block';

export async function blockUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = blockUserSchema.safeParse({
    blockedId: formData.get('blockedId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: parsed.data.blockedId,
  });

  if (error) {
    if (error.code === '23505') {
      return err('すでにブロック済みです');
    }
    return err('ブロックに失敗しました: ' + error.message);
  }

  revalidatePath('/mentors');
  revalidatePath('/chat');
  revalidatePath('/requests');
  revalidatePath('/profile/blocked');
  return ok(undefined);
}

export async function unblockUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = blockUserSchema.safeParse({
    blockedId: formData.get('blockedId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', parsed.data.blockedId);

  if (error) {
    return err('解除に失敗しました: ' + error.message);
  }

  revalidatePath('/profile/blocked');
  return ok(undefined);
}
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npm run test -- block-actions.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add "app/(dashboard)/profile/block-actions.ts" "app/(dashboard)/profile/block-actions.test.ts"
git commit -m "feat: add block/unblock server actions"
```

---

## Task 6: 通報用 Server Action

**Files:**
- Create: `app/(dashboard)/profile/report-actions.ts`
- Test: `app/(dashboard)/profile/report-actions.test.ts`

**Interfaces:**
- Consumes: `reportUserSchema` from Task 4 (`lib/validations/report.ts`), `getCurrentUser`, `ActionResult`/`ok`/`err`, `public.reports` table from Task 2
- Produces: `reportUserAction(prevState, formData): Promise<ActionResult<void>>`（`FormData` に `reportedId`, `reason` を要求）。Task 8 が使う。

- [ ] **Step 1: 失敗するテストを書く**

`app/(dashboard)/profile/report-actions.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, insertMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

import { reportUserAction } from './report-actions';

const REPORTED_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('reportUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'spam' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown reason before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'unknown' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a reports row with the current user as reporter', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'harassment' })
    );

    expect(fromMock).toHaveBeenCalledWith('reports');
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: 'user-1',
      reported_id: REPORTED_ID,
      reason: 'harassment',
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the insert fails', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { message: 'boom' } });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'spam' })
    );

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

Run: `npm run test -- report-actions.test.ts`
Expected: FAIL（`./report-actions` が存在しない）

- [ ] **Step 3: 実装する**

`app/(dashboard)/profile/report-actions.ts`:

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { reportUserSchema } from '@/lib/validations/report';

export async function reportUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = reportUserSchema.safeParse({
    reportedId: formData.get('reportedId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: parsed.data.reportedId,
    reason: parsed.data.reason,
  });

  if (error) {
    return err('通報に失敗しました: ' + error.message);
  }

  return ok(undefined);
}
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npm run test -- report-actions.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: コミット**

```bash
git add "app/(dashboard)/profile/report-actions.ts" "app/(dashboard)/profile/report-actions.test.ts"
git commit -m "feat: add report server action"
```

---

## Task 7: 通報・ブロックボタン（クライアントコンポーネント）

**Files:**
- Create: `app/(dashboard)/profile/block-button.tsx`
- Create: `app/(dashboard)/profile/report-button.tsx`

**Interfaces:**
- Consumes: `blockUserAction` from Task 5, `reportUserAction` from Task 6, `REPORT_REASON_KEYS`/`REPORT_REASON_LABELS` from Task 3
- Produces: `<BlockButton blockedId={string} redirectTo={string} />`, `<ReportButton reportedId={string} />`。Task 9（`/mentors/[id]`, `/users/[id]` への組み込み）が使う。

このプロジェクトにはページ／UIコンポーネントの単体テストが存在しない
（`app/(dashboard)/requests/request-cancel-action.tsx` や `review-form.tsx` も同様）ため、
このタスクにテストは書かない。Task 10 の最後にブラウザで動作確認する。

- [ ] **Step 1: `BlockButton` を実装する**

`app/(dashboard)/profile/block-button.tsx`:

```tsx
'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockUserAction } from './block-actions';

export function BlockButton({
  blockedId,
  redirectTo,
}: {
  blockedId: string;
  redirectTo: string;
}) {
  const [state, formAction, pending] = useActionState(blockUserAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push(redirectTo);
    }
  }, [state, redirectTo, router]);

  return (
    <div className="flex flex-col gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              'このユーザーをブロックしますか？進行中のマッチングは終了扱いになります。'
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="blockedId" value={blockedId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
        >
          ブロック
        </button>
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `ReportButton` を実装する**

`app/(dashboard)/profile/report-button.tsx`:

```tsx
'use client';

import { useActionState, useState } from 'react';
import { reportUserAction } from './report-actions';
import { REPORT_REASON_KEYS, REPORT_REASON_LABELS } from '@/lib/constants/report-reasons';

export function ReportButton({ reportedId }: { reportedId: string }) {
  const [state, formAction, pending] = useActionState(reportUserAction, null);
  const [open, setOpen] = useState(false);

  if (state?.success) {
    return <p className="text-xs text-muted">通報しました</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-red-400 hover:text-red-500"
      >
        通報する
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="reportedId" value={reportedId} />
      <select
        name="reason"
        required
        defaultValue=""
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
      >
        <option value="" disabled>
          理由を選択
        </option>
        {REPORT_REASON_KEYS.map((key) => (
          <option key={key} value={key}>
            {REPORT_REASON_LABELS[key]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '送信中...' : '送信'}
      </button>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: 型チェック・lintを実行する**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/profile/block-button.tsx" "app/(dashboard)/profile/report-button.tsx"`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add "app/(dashboard)/profile/block-button.tsx" "app/(dashboard)/profile/report-button.tsx"
git commit -m "feat: add block and report buttons"
```

---

## Task 8: ブロック中ユーザー一覧画面

**Files:**
- Create: `lib/blocks/get-blocked-users.ts`
- Create: `app/(dashboard)/profile/blocked/page.tsx`
- Create: `app/(dashboard)/profile/blocked/unblock-button.tsx`

**Interfaces:**
- Consumes: `public.get_blocked_profiles()` RPC from Task 1, `unblockUserAction` from Task 5, `getCurrentUser`
- Produces: `fetchBlockedUsers(supabase): Promise<BlockedUserSummary[]>`（`{ id, name, avatarUrl, blockedAt }[]`）。ページ自体は他タスクから参照されない。

`fetchBlockedUsers` は他の `fetch*` 系関数（`fetchAllUsers` など）と同様、
単純なクエリ+フィールド名変換のみなのでテストは書かない。

- [ ] **Step 1: `fetchBlockedUsers` を実装する**

`lib/blocks/get-blocked-users.ts`:

```ts
import type { createClient } from '@/lib/supabase/server';

export interface BlockedUserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  blockedAt: string;
}

interface BlockedProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  blocked_at: string;
}

export async function fetchBlockedUsers(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BlockedUserSummary[]> {
  const { data } = await supabase.rpc('get_blocked_profiles');
  const rows = (data ?? []) as unknown as BlockedProfileRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    blockedAt: row.blocked_at,
  }));
}
```

- [ ] **Step 2: `UnblockButton` を実装する**

`app/(dashboard)/profile/blocked/unblock-button.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { unblockUserAction } from '../block-actions';

export function UnblockButton({ blockedId }: { blockedId: string }) {
  const [state, formAction, pending] = useActionState(unblockUserAction, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="blockedId" value={blockedId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-border px-3 py-1 text-sm text-foreground transition hover:bg-background disabled:opacity-50"
        >
          解除
        </button>
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: 一覧ページを実装する**

`app/(dashboard)/profile/blocked/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchBlockedUsers } from '@/lib/blocks/get-blocked-users';
import { UnblockButton } from './unblock-button';

export default async function BlockedUsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const blockedUsers = await fetchBlockedUsers(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">ブロック中のユーザー</h1>

      {blockedUsers.length === 0 ? (
        <p className="text-sm text-muted">ブロック中のユーザーはいません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blockedUsers.map((blockedUser) => (
            <li
              key={blockedUser.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {blockedUser.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={blockedUser.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                )}
                <div>
                  <p className="font-bold text-foreground">{blockedUser.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(blockedUser.blockedAt).toLocaleDateString('ja-JP')} にブロック
                  </p>
                </div>
              </div>
              <UnblockButton blockedId={blockedUser.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 型チェック・lintを実行する**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/profile/blocked/**/*.tsx" lib/blocks/get-blocked-users.ts`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add lib/blocks/get-blocked-users.ts "app/(dashboard)/profile/blocked/page.tsx" "app/(dashboard)/profile/blocked/unblock-button.tsx"
git commit -m "feat: add blocked users list screen"
```

---

## Task 9: プロフィール画面への組み込み

**Files:**
- Modify: `app/(dashboard)/profile/page.tsx`
- Modify: `app/(dashboard)/mentors/[id]/page.tsx`
- Modify: `app/(dashboard)/users/[id]/page.tsx`

**Interfaces:**
- Consumes: `<BlockButton>`, `<ReportButton>` from Task 7、`/profile/blocked` page from Task 8

- [ ] **Step 1: `/profile` に「ブロック中のユーザー」への導線を追加する**

`app/(dashboard)/profile/page.tsx` の末尾（`編集する` リンクの部分）を変更する。

現在:

```tsx
      <Link
        href="/profile/edit"
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
      >
        編集する
      </Link>
    </div>
  );
}
```

変更後:

```tsx
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/profile/edit"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
        >
          編集する
        </Link>
        <Link href="/profile/blocked" className="text-sm text-muted underline">
          ブロック中のユーザー
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `/mentors/[id]` にボタンを組み込む**

`app/(dashboard)/mentors/[id]/page.tsx` の先頭 import に追加:

```tsx
import { BlockButton } from '../../profile/block-button';
import { ReportButton } from '../../profile/report-button';
```

現在（`</div>` は名前・バッジの行を閉じる部分、その直後に `{(mentor.affiliation...` が続く）:

```tsx
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{mentor.name}</h1>
            <AcceptingBadge accepting={mentor.accepting} />
            <RatingSummary stats={reviewStats} />
          </div>
        </div>
        {(mentor.affiliation || mentor.title) && (
```

変更後（`</div>` の直後、`{(mentor.affiliation...` の手前にブロックを挿入する）:

```tsx
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{mentor.name}</h1>
            <AcceptingBadge accepting={mentor.accepting} />
            <RatingSummary stats={reviewStats} />
          </div>
        </div>
        {user.id !== mentor.id && (
          <div className="flex flex-wrap items-center gap-2">
            <ReportButton reportedId={mentor.id} />
            <BlockButton blockedId={mentor.id} redirectTo="/mentors" />
          </div>
        )}
        {(mentor.affiliation || mentor.title) && (
```

- [ ] **Step 3: `/users/[id]` にボタンを組み込む**

`app/(dashboard)/users/[id]/page.tsx` の先頭 import に追加:

```tsx
import { BlockButton } from '../../profile/block-button';
import { ReportButton } from '../../profile/report-button';
```

現在（名前・バッジの行を閉じる `</div>` の直後に所属表示が続く）:

```tsx
            {profile.role === 'mentor' && <AcceptingBadge accepting={profile.accepting} />}
            <RatingSummary stats={reviewStats} />
          </div>
          {(profile.affiliation || profile.title) && (
```

変更後（`</div>` の直後、所属表示の手前にブロックを挿入する）:

```tsx
            {profile.role === 'mentor' && <AcceptingBadge accepting={profile.accepting} />}
            <RatingSummary stats={reviewStats} />
          </div>
          {user.id !== profile.id && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ReportButton reportedId={profile.id} />
              <BlockButton blockedId={profile.id} redirectTo="/chat" />
            </div>
          )}
          {(profile.affiliation || profile.title) && (
```

- [ ] **Step 4: 型チェック・lint・既存テストを実行する**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: すべてエラーなし・全テストPASS

- [ ] **Step 5: コミット**

```bash
git add "app/(dashboard)/profile/page.tsx" "app/(dashboard)/mentors/[id]/page.tsx" "app/(dashboard)/users/[id]/page.tsx"
git commit -m "feat: wire block/report buttons and blocked-list link into profile screens"
```

---

## Task 10: 管理者向け通報一覧画面

**Files:**
- Create: `app/admin/reports/get-admin-reports.ts`
- Test: `app/admin/reports/get-admin-reports.test.ts`
- Create: `app/admin/reports/page.tsx`
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `public.reports` table from Task 2, `REPORT_REASON_LABELS` from Task 3, `requireAdmin` (`lib/auth/require-admin.ts`)
- Produces: `buildAdminReports(rows, profiles): AdminReportRow[]`（純粋関数、テスト対象）, `fetchAdminReports(supabase): Promise<AdminReportRow[]>`

- [ ] **Step 1: `buildAdminReports` の失敗するテストを書く**

`app/admin/reports/get-admin-reports.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildAdminReports, type ReportRow, type ReporterProfileRow } from './get-admin-reports';

function reportRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: 'report-1',
    reporter_id: 'user-1',
    reported_id: 'user-2',
    reason: 'spam',
    created_at: '2026-09-03T00:00:00.000Z',
    ...overrides,
  };
}

const PROFILES: ReporterProfileRow[] = [
  { id: 'user-1', name: '通報した人' },
  { id: 'user-2', name: '通報された人' },
];

describe('buildAdminReports', () => {
  it('resolves reporter and reported names and the reason label', () => {
    const result = buildAdminReports([reportRow()], PROFILES);

    expect(result).toEqual([
      {
        id: 'report-1',
        reporterName: '通報した人',
        reportedName: '通報された人',
        reasonLabel: 'スパム',
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ]);
  });

  it('falls back to a placeholder name when a profile is missing', () => {
    const result = buildAdminReports([reportRow({ reporter_id: 'missing-user' })], PROFILES);

    expect(result[0].reporterName).toBe('不明なユーザー');
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

Run: `npm run test -- get-admin-reports.test.ts`
Expected: FAIL（`./get-admin-reports` が存在しない）

- [ ] **Step 3: 実装する**

`app/admin/reports/get-admin-reports.ts`:

```ts
import type { createClient } from '@/lib/supabase/server';
import { REPORT_REASON_LABELS, type ReportReason } from '@/lib/constants/report-reasons';

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  created_at: string;
}

export interface ReporterProfileRow {
  id: string;
  name: string;
}

export interface AdminReportRow {
  id: string;
  reporterName: string;
  reportedName: string;
  reasonLabel: string;
  createdAt: string;
}

export function buildAdminReports(
  rows: ReportRow[],
  profiles: ReporterProfileRow[]
): AdminReportRow[] {
  const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return rows.map((row) => ({
    id: row.id,
    reporterName: nameById.get(row.reporter_id) ?? '不明なユーザー',
    reportedName: nameById.get(row.reported_id) ?? '不明なユーザー',
    reasonLabel: REPORT_REASON_LABELS[row.reason],
    createdAt: row.created_at,
  }));
}

export async function fetchAdminReports(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminReportRow[]> {
  const { data } = await supabase
    .from('reports')
    .select('id, reporter_id, reported_id, reason, created_at')
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as unknown as ReportRow[];
  const userIds = Array.from(new Set(rows.flatMap((row) => [row.reporter_id, row.reported_id])));

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, name').in('id', userIds)
    : { data: [] as ReporterProfileRow[] };

  return buildAdminReports(rows, (profiles ?? []) as unknown as ReporterProfileRow[]);
}
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npm run test -- get-admin-reports.test.ts`
Expected: PASS（2件）

- [ ] **Step 5: 一覧ページを実装する**

`app/admin/reports/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { fetchAdminReports } from './get-admin-reports';

export default async function AdminReportsPage() {
  await requireAdmin();

  const supabase = await createClient();
  const reports = await fetchAdminReports(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">通報一覧</h1>

      {reports.length === 0 ? (
        <p className="text-sm text-muted">通報はありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground">{report.reporterName}</span>
                <span className="text-sm text-muted">→</span>
                <span className="font-bold text-foreground">{report.reportedName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {report.reasonLabel}
                </span>
              </div>
              <p className="text-xs text-muted">
                {new Date(report.createdAt).toLocaleString('ja-JP')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 6: 管理画面ナビに「通報一覧」を追加する**

`app/admin/layout.tsx` の `ADMIN_NAV_ITEMS` を変更する。

現在:

```tsx
const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '概要' },
  { href: '/admin/users', label: 'ユーザー一覧' },
];
```

変更後:

```tsx
const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '概要' },
  { href: '/admin/users', label: 'ユーザー一覧' },
  { href: '/admin/reports', label: '通報一覧' },
];
```

- [ ] **Step 7: 型チェック・lintを実行する**

Run: `npx tsc --noEmit && npm run lint`
Expected: エラーなし

- [ ] **Step 8: コミット**

```bash
git add app/admin/reports app/admin/layout.tsx
git commit -m "feat: add admin reports list screen"
```

---

## Task 11: マイグレーションの適用とブラウザでの動作確認

**Files:** なし（既存ファイルの実行・確認のみ）

- [ ] **Step 1: 全テストを実行する**

Run: `npm run test`
Expected: 全件PASS（既存172件 + 本計画で追加した分）

- [ ] **Step 2: lintと型チェックを実行する**

Run: `npm run lint && npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: マイグレーションをSupabaseに適用する**

Supabase MCPの `apply_migration`（または `supabase db push`）で
`20260903100200_0015_blocks.sql` と `20260903100300_0016_reports.sql` を適用する。

- [ ] **Step 4: 開発サーバーを起動し、ブラウザで一連の流れを確認する**

Run: `npm run dev`

以下をブラウザで確認する:
1. メンター詳細画面またはユーザー詳細画面に「通報する」「ブロック」ボタンが表示される
2. 「通報する」→ 理由を選択して送信 →「通報しました」に切り替わる
3. `/admin/reports` に今の通報が表示される（管理者アカウントでログイン）
4. 「ブロック」→ 確認ダイアログでOK → 一覧ページにリダイレクトされる
5. ブロックした相手のメンター一覧・検索結果に出てこないことを確認する
6. `/profile` →「ブロック中のユーザー」→ 先ほどブロックした相手が表示される
7. 「解除」を押すと一覧から消える
8. 解除後、再びメンター一覧・検索結果に相手が表示されることを確認する

- [ ] **Step 5: 確認が終わったらテスト用に作った通報・ブロックデータを片付ける**

ブラウザ確認で作成した `reports`/`blocks` の行を、Supabase MCPの `execute_sql` で削除する
（本番相当のデータベースにテストデータを残さないため）。
