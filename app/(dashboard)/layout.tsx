import Link from 'next/link';
import { signOutAction } from '../(auth)/actions';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/is-admin';

const NAV_ITEMS = [
  { href: '/home', label: 'ホーム' },
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
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-surface p-4">
        <span className="font-bold text-primary">学生-メンター マッチング</span>
        <nav className="flex items-center gap-4">
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
            <button type="submit" className="text-sm text-muted">
              ログアウト
            </button>
          </form>
        </nav>
      </header>
      <div className="p-8">{children}</div>
    </div>
  );
}
