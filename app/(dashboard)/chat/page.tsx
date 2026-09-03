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
  const chats = requests.filter(
    (request) => request.status === 'accepted' || request.status === 'completed'
  );
  const unreadCounts = await fetchUnreadCounts(
    supabase,
    user.id,
    chats.map((chat) => chat.id)
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.05em] text-[#17263d]">チャット</h1>

      {chats.length === 0 ? (
        <p className="text-sm text-muted">
          マッチングが承認されると、ここにチャットが表示されます。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="flex items-center justify-between rounded-[1.4rem] border border-[#17263d]/10 bg-[#fffaf3] p-5 shadow-[0_18px_40px_-30px_rgba(23,38,61,0.5)] transition hover:-translate-y-0.5 hover:border-[#e16f4d]/45"
            >
              <Link href={`/chat/${chat.id}`} className="flex flex-1 items-center gap-3">
                {chat.counterpartAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chat.counterpartAvatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{chat.counterpartName}</p>
                    {unreadCounts[chat.id] > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {unreadCounts[chat.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    {chat.category.label}
                    {chat.status === 'completed' && ' ・ 相談完了'}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <Link href={`/users/${chat.counterpartId}`} className="text-sm text-primary underline">
                  プロフィール
                </Link>
                <Link href={`/chat/${chat.id}`} className="text-sm text-primary">
                  開く
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
