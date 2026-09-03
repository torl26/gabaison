import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '概要' },
  { href: '/admin/users', label: 'ユーザー一覧' },
  { href: '/admin/reports', label: '通報一覧' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-surface p-4">
        <span className="font-bold text-primary">管理者画面</span>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
      <div className="p-4 sm:p-8">{children}</div>
    </div>
  );
}
