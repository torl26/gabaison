import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchUserProfile } from '@/lib/profile/get-user-profile';
import { ROLE_LABELS } from '@/lib/constants/roles';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const supabase = await createClient();
  const profile = await fetchUserProfile(supabase, id);

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">プロフィール</h1>
        <p className="mt-2 text-sm text-muted">見つかりません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
