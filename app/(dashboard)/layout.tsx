import Link from 'next/link';
import { signOutAction } from '../(auth)/actions';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/is-admin';
import { createClient } from '@/lib/supabase/server';
import { hasUnreadMessages } from './chat/get-unread-counts';

export const dynamic = 'force-dynamic';

const NAV_ITEMS = [
  { href: '/profile', label: 'プロフィール' },
  { href: '/mentors', label: 'メンターを探す' },
  { href: '/requests', label: 'マッチング申請' },
  { href: '/chat', label: 'チャット' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userIsAdmin = user ? await isAdmin(user.id) : false;
  const unreadChat = user ? await hasUnreadMessages(await createClient(), user.id) : false;

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf6eb] text-[#17263d]">
      <header className="sticky top-0 z-40 border-b border-[#17263d]/10 bg-[#fcf6eb]/90 px-4 py-4 shadow-[0_8px_35px_-28px_rgba(23,38,61,0.55)] backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Link href="/home" className="group inline-flex items-center gap-2.5" aria-label="TechTiesホームへ戻る">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#e16f4d] text-lg text-[#fff8ed] transition-transform duration-200 group-hover:-rotate-6">♡<span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#f5c45b] ring-2 ring-[#fcf6eb]" /></span>
            <span className="font-serif text-xl font-extrabold tracking-[-0.06em]">TechTies</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} className="relative text-xs font-bold text-[#17263d]/65 transition-colors hover:text-[#c85f41] sm:text-sm">{item.label}{item.href === '/chat' && unreadChat && <span aria-label="未読のチャットがあります" className="absolute -right-2 -top-1 size-2 rounded-full bg-[#e16f4d]" />}</Link>)}
            {userIsAdmin && <Link href="/admin" className="text-xs font-bold text-[#c85f41] sm:text-sm">管理者画面</Link>}
            <form action={signOutAction}><button type="submit" className="text-xs font-bold text-[#17263d]/45 transition-colors hover:text-[#e16f4d] sm:text-sm">ログアウト</button></form>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4 sm:p-8">{children}</div>
    </div>
  );
}
