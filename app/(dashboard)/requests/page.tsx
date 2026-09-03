import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from './get-requests';
import { RequestActions } from './request-actions';
import { RequestCancelAction } from './request-cancel-action';
import { RequestCompleteAction } from './request-complete-action';
import { ReviewForm } from './review-form';
import { fetchReviewedMatchIds } from '@/lib/reviews/get-reviews';
import { STATUS_LABELS } from '@/lib/constants/match-request-status';
import type { MatchRequestStatus } from '@/types/database';

const STATUS_BADGE_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-stone-200 text-stone-600',
  cancelled: 'bg-stone-200 text-stone-500',
  completed: 'bg-primary/10 text-primary',
};

const STATUS_TABS: MatchRequestStatus[] = ['pending', 'accepted', 'completed', 'rejected'];

function isMatchRequestStatus(value: string | undefined): value is MatchRequestStatus {
  return STATUS_TABS.includes(value as MatchRequestStatus);
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { status } = await searchParams;
  const statusFilter = isMatchRequestStatus(status) ? status : undefined;

  const supabase = await createClient();
  const [allRequests, reviewedMatchIds] = await Promise.all([
    fetchMatchRequests(supabase, user.id),
    fetchReviewedMatchIds(supabase, user.id),
  ]);
  const requests = allRequests.filter(
    (request) =>
      request.status !== 'cancelled' && (!statusFilter || request.status === statusFilter)
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">マッチング申請</h1>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/requests"
          className={`rounded-full border px-3 py-1 text-sm transition ${
            !statusFilter
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground hover:bg-surface'
          }`}
        >
          すべて
        </Link>
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/requests?status=${s}`}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              statusFilter === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:bg-surface'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <p className="text-sm text-muted">申請はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {request.counterpartAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={request.counterpartAvatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full border border-border object-cover"
                    />
                  )}
                  <span className="font-bold text-foreground">{request.counterpartName}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE_STYLES[request.status]}`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{request.category.label}</p>
              {request.message && (
                <p className="mt-2 text-sm text-foreground">{request.message}</p>
              )}
              <Link
                href={`/users/${request.counterpartId}`}
                className="mt-2 inline-block text-sm text-primary underline"
              >
                プロフィールを見る
              </Link>

              {request.isMentor && request.status === 'pending' && (
                <div className="mt-3">
                  <RequestActions requestId={request.id} />
                </div>
              )}

              {!request.isMentor && request.status === 'pending' && (
                <div className="mt-3">
                  <RequestCancelAction requestId={request.id} />
                </div>
              )}

              {request.status === 'accepted' && (
                <div className="mt-3 flex flex-col gap-3">
                  <Link
                    href={`/chat/${request.id}`}
                    className="text-sm text-primary underline"
                  >
                    チャットへ
                  </Link>
                  <RequestCompleteAction requestId={request.id} />
                </div>
              )}

              {request.status === 'completed' &&
                !request.isMentor &&
                !reviewedMatchIds.has(request.id) && (
                  <div className="mt-3">
                    <ReviewForm
                      requestId={request.id}
                      mentorName={request.counterpartName}
                    />
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
