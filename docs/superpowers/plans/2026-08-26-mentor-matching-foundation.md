# Mentor Matching Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared foundation of the student-mentor matching app (Supabase wiring, DB schema, shared types/validation, and an empty route skeleton) so a team can split up and build individual screens without colliding.

**Architecture:** Next.js App Router (React Server Components + Server Actions, no separate API layer) backed by Supabase (Auth, Postgres, Realtime). This plan creates the connection layer, database migration, shared types/constants/validation, and route-group skeletons for every screen listed in the spec. It does not implement any screen's actual UI/logic — that's the work each teammate picks up after this plan lands.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `@supabase/supabase-js`, `@supabase/ssr`, Zod, Vitest (unit tests for Zod schemas only, per spec).

**Spec:** `docs/superpowers/specs/2026-08-26-mentor-matching-design.md`

## Global Constraints

- No separate API layer (REST/tRPC) — Server Actions are the backend, per spec §3.
- Auth is Supabase Auth with email + password only (no social login), per spec §2/§3.
- Row Level Security must be enabled on every table, per spec §6.
- Server Actions validate input with Zod at the start of the action, per spec §7.
- Server Actions return the unified shape `{ success: boolean; error?: string }`, per spec §7.
- Automated tests are limited to Zod validation schema unit tests for this MVP; no component/E2E tests, per spec §8.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only client-exposed env vars; a Service Role Key, if ever needed, is server-only, per spec §9.
- The four support categories are fixed: `career` / `skill` / `project` / `academic`, per spec §1/§4.1.

---

### Task 1: Install dependencies and configure the Vitest test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` command (runs `vitest run`); `vitest.config.mts` resolves the `@/*` path alias so later tasks' tests can `import` with the same alias used in app code. (`.mts`, not `.ts` — the package isn't `"type": "module"`, and Vitest's native config loader warns on CommonJS-loaded ESM syntax otherwise.)

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest
```

- [ ] **Step 2: Add the `test` script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.mts`**

```ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Verify the runner works with no tests yet**

Run: `npx vitest run --passWithNoTests`
Expected: exits 0, reports no test files found.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.mts
git commit -m "chore: add supabase/zod deps and configure vitest"
```

---

### Task 2: Supabase env helper

**Files:**
- Create: `lib/supabase/env.ts`
- Test: `lib/supabase/env.test.ts`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces: `getSupabaseEnv(): { url: string; anonKey: string }` (throws if either var is missing) from `lib/supabase/env.ts`. Used by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
// lib/supabase/env.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { getSupabaseEnv } from './env';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getSupabaseEnv', () => {
  it('returns url and anonKey when both env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(getSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set');
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/supabase/env.test.ts`
Expected: FAIL — `Cannot find module './env'` (or similar).

- [ ] **Step 3: Write the implementation**

```ts
// lib/supabase/env.ts
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  return { url, anonKey };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/supabase/env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/env.ts lib/supabase/env.test.ts
git commit -m "feat: add supabase env helper"
```

---

### Task 3: Supabase browser/server clients and env template

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `getSupabaseEnv()` from `lib/supabase/env.ts` (Task 2).
- Produces: `createClient()` (sync, browser) from `lib/supabase/client.ts`; `createClient()` (async, server) from `lib/supabase/server.ts`. Later screen work imports these to talk to Supabase from Client Components vs. Server Components/Actions.

- [ ] **Step 1: Create the browser client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 2: Create the server client**

```ts
// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component から呼ばれた場合は無視する（セッション更新はMiddleware側で行う想定）
        }
      },
    },
  });
}
```

- [ ] **Step 3: Add the env template and un-ignore it**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

In `.gitignore`, under the `# env files` section, add a line so the example file is still tracked:
```
!.env.local.example
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts .env.local.example .gitignore
git commit -m "feat: add supabase browser/server clients"
```

---

### Task 4: Database types

**Files:**
- Create: `types/database.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Profile`, `Category`, `MentorCategory`, `MatchRequest`, `Message` types, matching spec §4.1 exactly. Later Server Actions and screen components import these.

- [ ] **Step 1: Write the types**

```ts
// types/database.ts
export type ProfileRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  role: ProfileRole;
  name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  key: 'career' | 'skill' | 'project' | 'academic';
  label: string;
}

export interface MentorCategory {
  mentor_id: string;
  category_id: number;
}

export type MatchRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface MatchRequest {
  id: string;
  student_id: string;
  mentor_id: string;
  category_id: number;
  status: MatchRequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/database.ts
git commit -m "feat: add database types"
```

---

### Task 5: Database migration (schema + RLS + category seed)

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Test: `supabase/migrations/0001_init.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: SQL migration file defining `profiles`, `categories`, `mentor_categories`, `match_requests`, `messages`, their RLS policies, and the 4 seed categories, per spec §4 and §6. Applied later with `supabase db push` (or pasted into the SQL editor) once a real Supabase project exists.

- [ ] **Step 1: Write the failing regression test**

This test guards against the migration file silently losing a table/policy/seed row later — it's a text-content check, not a live DB check (no Supabase project exists yet).

```ts
// supabase/migrations/0001_init.test.ts
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0001_init.sql'),
  'utf-8'
).toLowerCase();

describe('0001_init.sql', () => {
  it('creates all five tables', () => {
    for (const table of [
      'profiles',
      'categories',
      'mentor_categories',
      'match_requests',
      'messages',
    ]) {
      expect(sql).toContain(`create table public.${table}`);
    }
  });

  it('enables row level security on all five tables', () => {
    const matches = sql.match(/enable row level security/g) ?? [];
    expect(matches.length).toBe(5);
  });

  it('seeds the four fixed categories', () => {
    for (const key of ['career', 'skill', 'project', 'academic']) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it('restricts message inserts to accepted match_requests', () => {
    expect(sql).toContain("mr.status = 'accepted'");
  });

  it('blocks self-service role changes on profiles', () => {
    expect(sql).toContain('role cannot be changed after signup');
    expect(sql).toContain(
      "with check (auth.uid() = id and role in ('student', 'mentor'))"
    );
  });

  it('restricts match_request status changes to the mentor and locks foreign keys', () => {
    expect(sql).toContain('only the mentor can change the request status');
    expect(sql).toContain(
      'student_id, mentor_id, and category_id cannot be changed'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run supabase/migrations/0001_init.test.ts`
Expected: FAIL — `0001_init.sql` doesn't exist yet.

- [ ] **Step 3: Write the migration**

```sql
-- supabase/migrations/0001_init.sql

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
  for insert to authenticated with check (auth.uid() = id and role in ('student', 'mentor'));

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- role must never change after signup (blocks self-escalation to 'admin',
-- or a student flipping themselves to 'mentor', via a direct client update)
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed after signup';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_change();

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run supabase/migrations/0001_init.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql supabase/migrations/0001_init.test.ts
git commit -m "feat: add initial database migration with RLS"
```

---

### Task 6: Category constants

**Files:**
- Create: `lib/constants/categories.ts`
- Test: `lib/constants/categories.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `CATEGORY_KEYS` (readonly tuple), `CategoryKey` type, `CATEGORIES` (key+label list) from `lib/constants/categories.ts`. Consumed by Task 9 (Zod schemas) and by later screen work (category filter UI, mentor category picker).

- [ ] **Step 1: Write the failing test**

```ts
// lib/constants/categories.test.ts
import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_KEYS } from './categories';

describe('categories', () => {
  it('has exactly the four fixed category keys, in order', () => {
    expect(CATEGORY_KEYS).toEqual(['career', 'skill', 'project', 'academic']);
  });

  it('has a non-empty label for every category, in the same order as the keys', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual(CATEGORY_KEYS);
    for (const category of CATEGORIES) {
      expect(category.label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/constants/categories.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/constants/categories.ts
export const CATEGORY_KEYS = ['career', 'skill', 'project', 'academic'] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  career: 'キャリア相談',
  skill: 'スキル/技術メンタリング',
  project: 'プロジェクト支援',
  academic: '学業/研究支援',
};

export const CATEGORIES: CategoryDefinition[] = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/constants/categories.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/constants/categories.ts lib/constants/categories.test.ts
git commit -m "feat: add category constants"
```

---

### Task 7: Server Action result type

**Files:**
- Create: `lib/actions/types.ts`
- Test: `lib/actions/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ActionResult<T>` type, `ok<T>(data: T)`, `err(message: string)` from `lib/actions/types.ts`. Every Server Action written later returns `ActionResult<...>` via these helpers, per spec §7.

- [ ] **Step 1: Write the failing test**

```ts
// lib/actions/types.test.ts
import { describe, expect, it } from 'vitest';
import { err, ok } from './types';

describe('ok', () => {
  it('wraps data in a success result', () => {
    expect(ok({ id: '1' })).toEqual({ success: true, data: { id: '1' } });
  });
});

describe('err', () => {
  it('wraps a message in a failure result', () => {
    expect(err('something went wrong')).toEqual({
      success: false,
      error: 'something went wrong',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/actions/types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/actions/types.ts
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function err(error: string): ActionResult<never> {
  return { success: false, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/actions/types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/actions/types.ts lib/actions/types.test.ts
git commit -m "feat: add server action result type"
```

---

### Task 8: Auth validation schemas

**Files:**
- Create: `lib/validations/auth.ts`
- Test: `lib/validations/auth.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `signupSchema`, `SignupInput`, `loginSchema`, `LoginInput` from `lib/validations/auth.ts`. Consumed later by the signup/login screen's Server Actions.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/validations/auth.test.ts
import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from './auth';

describe('signupSchema', () => {
  it('accepts a valid signup payload', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      role: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'short',
      role: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a role outside student/mentor', () => {
    const result = signupSchema.safeParse({
      email: 'student@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'student@example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'student@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/validations/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/validations/auth.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  role: z.enum(['student', 'mentor'], {
    message: '種別を選択してください',
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validations/auth.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validations/auth.ts lib/validations/auth.test.ts
git commit -m "feat: add auth validation schemas"
```

---

### Task 9: Profile / match-request / message validation schemas

**Files:**
- Create: `lib/validations/profile.ts`
- Create: `lib/validations/match-request.ts`
- Create: `lib/validations/message.ts`
- Test: `lib/validations/profile.test.ts`
- Test: `lib/validations/match-request.test.ts`
- Test: `lib/validations/message.test.ts`

**Interfaces:**
- Consumes: `CATEGORY_KEYS` from `lib/constants/categories.ts` (Task 6).
- Produces: `profileSchema`/`ProfileInput`, `matchRequestSchema`/`MatchRequestInput`, `messageSchema`/`MessageInput`. Consumed later by the profile, mentor-search/matching, and chat screens' Server Actions.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/validations/profile.test.ts
import { describe, expect, it } from 'vitest';
import { profileSchema } from './profile';

describe('profileSchema', () => {
  it('accepts a valid profile with categories', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: 'よろしくお願いします。',
      categoryKeys: ['career', 'skill'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid profile without categories (student)', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = profileSchema.safeParse({ name: '', bio: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category key', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      categoryKeys: ['unknown'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an https avatarUrl', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a javascript: avatarUrl', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      avatarUrl: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
  });
});
```

```ts
// lib/validations/match-request.test.ts
import { describe, expect, it } from 'vitest';
import { matchRequestSchema } from './match-request';

const MENTOR_ID = '11111111-1111-4111-8111-111111111111';

describe('matchRequestSchema', () => {
  it('accepts a valid match request', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'career',
      message: 'よろしくお願いします。',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a match request without a message', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'career',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid mentorId', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: 'not-a-uuid',
      categoryKey: 'career',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category key', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});
```

```ts
// lib/validations/message.test.ts
import { describe, expect, it } from 'vitest';
import { messageSchema } from './message';

const MATCH_ID = '22222222-2222-4222-8222-222222222222';

describe('messageSchema', () => {
  it('accepts a valid message', () => {
    const result = messageSchema.safeParse({
      matchId: MATCH_ID,
      content: 'こんにちは',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty message', () => {
    const result = messageSchema.safeParse({ matchId: MATCH_ID, content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid matchId', () => {
    const result = messageSchema.safeParse({
      matchId: 'not-a-uuid',
      content: 'こんにちは',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/validations/profile.test.ts lib/validations/match-request.test.ts lib/validations/message.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementations**

```ts
// lib/validations/profile.ts
import { z } from 'zod';
import { CATEGORY_KEYS } from '@/lib/constants/categories';

export const profileSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(50, '表示名は50文字以内で入力してください'),
  bio: z.string().max(1000, '自己紹介は1000文字以内で入力してください'),
  avatarUrl: z
    .url({ protocol: /^https?$/, message: 'URLの形式が正しくありません' })
    .optional(),
  categoryKeys: z.array(z.enum(CATEGORY_KEYS)).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
```

```ts
// lib/validations/match-request.ts
import { z } from 'zod';
import { CATEGORY_KEYS } from '@/lib/constants/categories';

export const matchRequestSchema = z.object({
  mentorId: z.string().uuid('メンターIDが不正です'),
  categoryKey: z.enum(CATEGORY_KEYS, {
    message: 'カテゴリを選択してください',
  }),
  message: z.string().max(1000, 'メッセージは1000文字以内で入力してください').optional(),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
```

```ts
// lib/validations/message.ts
import { z } from 'zod';

export const messageSchema = z.object({
  matchId: z.string().uuid('マッチングIDが不正です'),
  content: z
    .string()
    .min(1, 'メッセージを入力してください')
    .max(2000, 'メッセージは2000文字以内で入力してください'),
});

export type MessageInput = z.infer<typeof messageSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validations/profile.test.ts lib/validations/match-request.test.ts lib/validations/message.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validations/profile.ts lib/validations/match-request.ts lib/validations/message.ts \
  lib/validations/profile.test.ts lib/validations/match-request.test.ts lib/validations/message.test.ts
git commit -m "feat: add profile, match-request, and message validation schemas"
```

---

### Task 10: Landing page and auth route skeletons

**Files:**
- Modify: `app/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: nothing (Next.js `Link` only).
- Produces: routes `/`, `/login`, `/signup`. These are empty screens with a heading and a `TODO` marker — the auth screen owner fills in the actual signup/login forms and wires them to `signupSchema`/`loginSchema` (Task 8) and Supabase Auth.

- [ ] **Step 1: Replace the default landing page**

```tsx
// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">学生-メンター マッチング</h1>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          ログイン
        </Link>
        <Link href="/signup" className="rounded border border-black px-4 py-2">
          新規登録
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the login screen skeleton**

```tsx
// app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-bold">ログイン</h1>
      {/* TODO: 担当者がメール+パスワードのログインフォームを実装 */}
    </main>
  );
}
```

- [ ] **Step 3: Create the signup screen skeleton**

```tsx
// app/(auth)/signup/page.tsx
export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-bold">新規登録</h1>
      {/* TODO: 担当者が学生/メンター種別選択を含む登録フォームを実装 */}
    </main>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx "app/(auth)/login/page.tsx" "app/(auth)/signup/page.tsx"
git commit -m "feat: add landing page and auth route skeletons"
```

---

### Task 11: Dashboard layout and screen skeletons

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/profile/page.tsx`
- Create: `app/(dashboard)/mentors/page.tsx`
- Create: `app/(dashboard)/mentors/[id]/page.tsx`
- Create: `app/(dashboard)/requests/page.tsx`
- Create: `app/(dashboard)/chat/[matchId]/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: routes `/profile`, `/mentors`, `/mentors/[id]`, `/requests`, `/chat/[matchId]`, all sharing one nav layout. Each page is an empty screen with a heading and a `TODO` marker for the teammate who owns that screen.

- [ ] **Step 1: Create the dashboard layout with nav**

```tsx
// app/(dashboard)/layout.tsx
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/profile', label: 'プロフィール' },
  { href: '/mentors', label: 'メンターを探す' },
  { href: '/requests', label: 'マッチング申請' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-bold">学生-メンター マッチング</span>
        <nav className="flex gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="p-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create the profile screen skeleton**

```tsx
// app/(dashboard)/profile/page.tsx
export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-xl font-bold">プロフィール</h1>
      {/* TODO: 担当者がプロフィール表示・編集フォームを実装 */}
    </div>
  );
}
```

- [ ] **Step 3: Create the mentor search screen skeleton**

```tsx
// app/(dashboard)/mentors/page.tsx
export default function MentorsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">メンターを探す</h1>
      {/* TODO: 担当者がカテゴリ絞り込み・メンター一覧を実装 */}
    </div>
  );
}
```

- [ ] **Step 4: Create the mentor detail screen skeleton**

```tsx
// app/(dashboard)/mentors/[id]/page.tsx
export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold">メンター詳細</h1>
      <p className="text-sm text-gray-500">mentorId: {id}</p>
      {/* TODO: 担当者がメンター情報表示・マッチング申請フォームを実装 */}
    </div>
  );
}
```

- [ ] **Step 5: Create the match requests screen skeleton**

```tsx
// app/(dashboard)/requests/page.tsx
export default function RequestsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">マッチング申請</h1>
      {/* TODO: 担当者が申請一覧・承認/却下UIを実装 */}
    </div>
  );
}
```

- [ ] **Step 6: Create the chat screen skeleton**

```tsx
// app/(dashboard)/chat/[matchId]/page.tsx
export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold">チャット</h1>
      <p className="text-sm text-gray-500">matchId: {matchId}</p>
      {/* TODO: 担当者がメッセージ一覧・送信フォーム・Realtime購読を実装 */}
    </div>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add "app/(dashboard)"
git commit -m "feat: add dashboard layout and screen skeletons"
```

---

### Task 12: README update and final integration check

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything built in Tasks 1–11 (describes how to use it).
- Produces: setup instructions and a screen-ownership table teammates use to claim a route from Task 10/11 without colliding.

- [ ] **Step 1: Rewrite `README.md`**

```markdown
# 学生-メンター マッチングアプリ

設計書: [docs/superpowers/specs/2026-08-26-mentor-matching-design.md](docs/superpowers/specs/2026-08-26-mentor-matching-design.md)

## セットアップ

\`\`\`bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase プロジェクトの URL / anon key を設定する
npm run dev
\`\`\`

Supabaseプロジェクトを作成したら、`supabase/migrations/0001_init.sql` を
SupabaseのSQL Editor（または `supabase db push`）で適用してください。

## テスト

\`\`\`bash
npm test        # Zodバリデーションスキーマの単体テスト（vitest）
npx tsc --noEmit  # 型チェック
npm run build    # ビルド確認
\`\`\`

## ディレクトリ構成

- `lib/supabase/` — Supabaseクライアント（`client.ts`=ブラウザ用, `server.ts`=Server Components/Actions用）
- `lib/validations/` — Zodバリデーションスキーマ（Server Actionsの冒頭で使用）
- `lib/actions/types.ts` — Server Actionsの共通戻り値型 `ActionResult`
- `lib/constants/categories.ts` — 固定4カテゴリの定義
- `types/database.ts` — DBテーブルに対応する型
- `supabase/migrations/` — DBスキーマ・RLSポリシー

## 画面の分担

各画面はNext.js App Routerのroute groupで既に骨組み（空のpage.tsx）が
用意されています。担当が決まったら、そのpage.tsxとそこから呼ぶ
Server Actionsを実装してください。

| 画面 | ルート | ファイル |
|---|---|---|
| ログイン | `/login` | `app/(auth)/login/page.tsx` |
| 新規登録 | `/signup` | `app/(auth)/signup/page.tsx` |
| プロフィール | `/profile` | `app/(dashboard)/profile/page.tsx` |
| メンター検索 | `/mentors` | `app/(dashboard)/mentors/page.tsx` |
| メンター詳細・申請 | `/mentors/[id]` | `app/(dashboard)/mentors/[id]/page.tsx` |
| マッチング申請一覧・承認 | `/requests` | `app/(dashboard)/requests/page.tsx` |
| チャット | `/chat/[matchId]` | `app/(dashboard)/chat/[matchId]/page.tsx` |

Server Actionsは各画面のファイル内（または同じディレクトリの `actions.ts`）に
追加し、`lib/validations/` のスキーマで検証したうえで
`lib/actions/types.ts` の `ok()` / `err()` を使って結果を返してください。
```

- [ ] **Step 2: Run the full verification suite**

Run:
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
Expected: all four commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add setup instructions and screen ownership table"
```
