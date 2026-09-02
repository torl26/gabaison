import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { redirect } from 'next/navigation';
import { fetchUserProfile } from '@/lib/profile/get-user-profile';
import { ROLE_LABELS } from '@/lib/constants/roles';

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

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
      <div className="flex items-start gap-4">
        {profile.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
          {profile.bio && <p className="mt-2 text-sm text-foreground">{profile.bio}</p>}
        </div>
      </div>

      {profile.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.categories.map((category) => (
            <span
              key={category.key}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {category.label}
            </span>
          ))}
        </div>
      )}

      <Link
        href="/profile/edit"
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
      >
        編集する
      </Link>
    </div>
  );
}
