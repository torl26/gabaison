import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from '../requests/get-requests';

const DUMMY_EVENTS = [
  {
    icon: '🎤',
    date: '9/20(土) 19:00〜',
    title: 'オンライン交流会',
    description: '先輩メンターと気軽に話せるオンラインイベントです。',
  },
  {
    icon: '📚',
    date: '9/27(日) 14:00〜',
    title: '就活対策セミナー',
    description: 'ES添削と面接対策のポイントを現役メンターが解説します。',
  },
  {
    icon: '💻',
    date: '10/4(土)〜5(日)',
    title: 'ハッカソン参加者募集',
    description: 'チームを組んで短期間の開発に挑戦するイベントです。',
  },
];

const LINKS = [
  {
    href: '/mentors',
    icon: '🔍',
    title: 'メンターを探す',
    description: 'カテゴリからメンターを探して、マッチングを申請できます。',
  },
  {
    href: '/requests',
    icon: '🤝',
    title: 'マッチング申請',
    description: '送った・受け取った申請の状況を確認できます。',
  },
  {
    href: '/profile',
    icon: '👤',
    title: 'プロフィール',
    description: '名前や自己紹介、対応カテゴリを編集できます。',
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  const requests = await fetchMatchRequests(supabase, user.id);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground shadow-md sm:p-8">
        <p className="text-sm opacity-90">おかえりなさい</p>
        <h1 className="mt-1 text-2xl font-bold break-words sm:text-3xl">
          {profile?.name ? `ようこそ、${profile.name}さん` : 'ようこそ'}
        </h1>
        <p className="mt-2 text-sm opacity-90">今日もマッチングを進めましょう ✨</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">イベント情報</h2>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">PR</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {DUMMY_EVENTS.map((event) => (
            <div
              key={event.title}
              className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <span className="text-3xl">{event.icon}</span>
              <span className="text-xs font-bold text-primary">{event.date}</span>
              <span className="font-bold text-foreground">{event.title}</span>
              <p className="text-sm text-muted">{event.description}</p>
            </div>
          ))}
        </div>
      </div>

      <ul className="grid flex-1 auto-rows-fr gap-4 sm:grid-cols-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-5xl">{link.icon}</span>
                {link.href === '/requests' && pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    審査中 {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-foreground">{link.title}</span>
              <p className="text-sm text-muted">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
