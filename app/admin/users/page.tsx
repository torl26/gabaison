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
