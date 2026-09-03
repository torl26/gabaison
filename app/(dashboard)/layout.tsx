import Link from 'next/link';
import { signOutAction } from '../(auth)/actions';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/is-admin';

const NAV_ITEMS = [
  { href: '/profile', label: 'プロフィール' },
  { href: '/mentors', label: 'メンターを探す' },
  { href: '/requests', label: 'マッチング申請' },
  { href: '/chat', label: 'チャット' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userIsAdmin = user ? await isAdmin(user.id) : false;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-surface p-4">
        <Link href="/home" className="font-bold text-primary">
          学生-メンター マッチング
        </Link>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-foreground">
              {item.label}
            </Link>
          ))}
          {userIsAdmin && (
            <Link href="/admin" className="text-sm text-primary">
              管理者画面
            </Link>
          )}
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-muted transition-colors hover:text-red-500">
              ログアウト
            </button>
          </form>
        </nav>
      </header>
      <div className="flex flex-1 flex-col p-4 sm:p-8">{children}</div>
    </div>
  );
}
