import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { redirect } from 'next/navigation';
import { fetchUserProfile } from '@/lib/profile/get-user-profile';
import { calculateCompleteness } from '@/lib/profile/completeness';
import { fetchMentorStats } from '@/lib/profile/get-profile-stats';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { AcceptingBadge, MentorStatsRow, ProfileDetails } from './profile-details';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const profile = await fetchUserProfile(supabase, user.id);

  if (!profile) {
    return <p className="text-muted">プロフィールが見つかりませんでした。</p>;
  }

  const completeness = calculateCompleteness(profile);
  const stats = profile.role === 'mentor' ? await fetchMentorStats(supabase, user.id) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <div className="flex items-start gap-4">
        {profile.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {ROLE_LABELS[profile.role]}
            </span>
            {profile.role === 'mentor' && <AcceptingBadge accepting={profile.accepting} />}
          </div>
          {profile.headline && (
            <p className="mt-1 text-sm text-foreground">{profile.headline}</p>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">プロフィール完成度</h2>
          <span className="text-sm font-bold text-primary">{completeness.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        {completeness.missing.length > 0 ? (
          <p className="text-xs text-muted">
            未入力: {completeness.missing.map((item) => item.label).join('、')}
          </p>
        ) : (
          <p className="text-xs text-muted">すべて入力済みです ✨</p>
        )}
      </section>

      {stats && <MentorStatsRow stats={stats} />}

      <ProfileDetails profile={profile} />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/profile/edit"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
        >
          編集する
        </Link>
        <Link href="/profile/blocked" className="text-sm text-muted underline">
          ブロック中のユーザー
        </Link>
      </div>
    </div>
  );
}
