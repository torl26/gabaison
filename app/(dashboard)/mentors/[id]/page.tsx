import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMentorStats } from '@/lib/profile/get-profile-stats';
import { fetchMentorById } from '../get-mentors';
import { AcceptingBadge, MentorStatsRow, ProfileDetails } from '../../profile/profile-details';
import { MatchRequestForm } from './match-request-form';

export default async function MentorDetailPage({
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
  const mentor = await fetchMentorById(supabase, id);

  if (!mentor) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">メンター詳細</h1>
        <p className="mt-2 text-sm text-muted">メンターが見つかりません</p>
      </div>
    );
  }

  const stats = await fetchMentorStats(supabase, mentor.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {mentor.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{mentor.name}</h1>
            <AcceptingBadge accepting={mentor.accepting} />
          </div>
        </div>
        {mentor.headline && <p className="text-sm font-bold text-foreground">{mentor.headline}</p>}
        <MentorStatsRow stats={stats} />
      </div>

      <ProfileDetails profile={mentor} />

      {mentor.accepting ? (
        <MatchRequestForm mentorId={mentor.id} categories={mentor.categories} />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          このメンターは現在、新しい申請を受け付けていません。
        </p>
      )}
    </div>
  );
}
