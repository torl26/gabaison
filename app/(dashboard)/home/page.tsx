import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from '../requests/get-requests';

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

      <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-6 text-sm text-muted">
        広告枠（準備中）
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
