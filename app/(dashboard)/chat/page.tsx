import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from '../requests/get-requests';
import { fetchUnreadCounts } from './get-unread-counts';

export default async function ChatListPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const requests = await fetchMatchRequests(supabase, user.id);
  const chats = requests.filter((request) => request.status === 'accepted');
  const unreadCounts = await fetchUnreadCounts(
    supabase,
    user.id,
    chats.map((chat) => chat.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">チャット</h1>

      {chats.length === 0 ? (
        <p className="text-sm text-muted">
          マッチングが承認されると、ここにチャットが表示されます。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/chat/${chat.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{chat.counterpartName}</p>
                    {unreadCounts[chat.id] > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {unreadCounts[chat.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{chat.category.label}</p>
                </div>
                <span className="text-sm text-primary">開く</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
