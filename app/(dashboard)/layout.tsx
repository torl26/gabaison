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
