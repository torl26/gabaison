import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from './get-requests';
import { RequestActions } from './request-actions';
import { RequestCancelAction } from './request-cancel-action';
import { RequestCompleteAction } from './request-complete-action';
import { ConsultationFeedbackForm } from './consultation-feedback-form';
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
  const [{ data: feedbackRows }, allRequests] = await Promise.all([
    supabase
      .from('consultation_feedback')
      .select('match_id, author_id')
      .eq('author_id', user.id),
    fetchMatchRequests(supabase, user.id),
  ]);
  const submittedFeedback = new Set(
    ((feedbackRows ?? []) as { match_id: string; author_id: string }[]).map(
      (row) => `${row.match_id}:${row.author_id}`
    )
  );
  const requests = allRequests.filter(
    (request) =>
      request.status !== 'cancelled' && (!statusFilter || request.status === statusFilter)
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.05em] text-[#17263d]">マッチング申請</h1>

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
              className="rounded-[1.4rem] border border-[#17263d]/10 bg-[#fffaf3] p-5 shadow-[0_18px_40px_-30px_rgba(23,38,61,0.5)]"
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

              {request.status === 'accepted' && request.isMentor && (
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
                !submittedFeedback.has(`${request.id}:${user.id}`) && (
                  <ConsultationFeedbackForm
                    requestId={request.id}
                    role={request.isMentor ? 'mentor' : 'student'}
                    counterpartName={request.counterpartName}
                  />
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
