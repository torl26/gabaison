import Link from 'next/link';
import { signOutAction } from '../(auth)/actions';

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
        <nav className="flex items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm">
              {item.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-gray-500">
              ログアウト
            </button>
          </form>
        </nav>
      </header>
      <div className="p-8">{children}</div>
    </div>
  );
}
