import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMentorById } from '../get-mentors';
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          {mentor.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          )}
          <h1 className="text-xl font-bold text-foreground">{mentor.name}</h1>
        </div>
        <p className="mt-1 text-sm text-muted">{mentor.bio}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {mentor.categories.map((category) => (
            <span
              key={category.key}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <MatchRequestForm mentorId={mentor.id} categories={mentor.categories} />
    </div>
  );
}
