import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from '../requests/get-requests';

const LINKS = [
  {
    href: '/mentors',
    title: 'メンターを探す',
    description: 'カテゴリからメンターを探して、マッチングを申請できます。',
  },
  {
    href: '/requests',
    title: 'マッチング申請',
    description: '送った・受け取った申請の状況を確認できます。',
  },
  {
    href: '/profile',
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">
        {profile?.name ? `ようこそ、${profile.name}さん` : 'ようこそ'}
      </h1>

      <ul className="grid gap-4 sm:grid-cols-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{link.title}</span>
                {link.href === '/requests' && pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    審査中 {pendingCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
