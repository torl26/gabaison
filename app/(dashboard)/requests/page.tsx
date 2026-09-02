import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from './get-requests';
import { RequestActions } from './request-actions';
import { RequestCancelAction } from './request-cancel-action';
import { STATUS_LABELS } from '@/lib/constants/match-request-status';

const STATUS_BADGE_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-stone-200 text-stone-600',
  cancelled: 'bg-stone-200 text-stone-500',
};

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const requests = await fetchMatchRequests(supabase, user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">マッチング申請</h1>

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
                <span className="font-bold text-foreground">{request.counterpartName}</span>
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
                <Link
                  href={`/chat/${request.id}`}
                  className="mt-3 inline-block text-sm text-primary underline"
                >
                  チャットへ
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
