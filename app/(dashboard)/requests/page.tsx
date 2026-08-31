import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from './get-requests';
import { RequestActions } from './request-actions';

const STATUS_LABELS = {
  pending: '審査中',
  accepted: '承認済み',
  rejected: '却下',
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
      <h1 className="text-xl font-bold">マッチング申請</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">申請はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <li key={request.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">{request.counterpartName}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{request.category.label}</p>
              {request.message && (
                <p className="mt-2 text-sm text-gray-800">{request.message}</p>
              )}

              {request.isMentor && request.status === 'pending' && (
                <div className="mt-3">
                  <RequestActions requestId={request.id} />
                </div>
              )}

              {request.status === 'accepted' && (
                <Link
                  href={`/chat/${request.id}`}
                  className="mt-3 inline-block text-sm underline"
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
