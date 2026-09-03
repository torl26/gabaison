import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchUserProfile } from '@/lib/profile/get-user-profile';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { fetchReviewsFor } from '@/lib/reviews/get-reviews';
import { AcceptingBadge, ProfileDetails } from '../../profile/profile-details';
import { RatingSummary, ReviewsSection } from '../../profile/reviews-section';

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
  const { stats: reviewStats, reviews } = await fetchReviewsFor(supabase, id);

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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {ROLE_LABELS[profile.role]}
            </span>
            {profile.role === 'mentor' && <AcceptingBadge accepting={profile.accepting} />}
            <RatingSummary stats={reviewStats} />
          </div>
          {profile.headline && (
            <p className="mt-1 text-sm text-foreground">{profile.headline}</p>
          )}
        </div>
      </div>

      <ProfileDetails profile={profile} />

      {profile.role === 'mentor' && (
        <ReviewsSection stats={reviewStats} reviews={reviews} />
      )}
    </div>
  );
}
