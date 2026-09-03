import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchBlockedUsers } from '@/lib/blocks/get-blocked-users';
import { UnblockButton } from './unblock-button';

export default async function BlockedUsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const blockedUsers = await fetchBlockedUsers(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">ブロック中のユーザー</h1>

      {blockedUsers.length === 0 ? (
        <p className="text-sm text-muted">ブロック中のユーザーはいません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blockedUsers.map((blockedUser) => (
            <li
              key={blockedUser.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {blockedUser.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={blockedUser.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                )}
                <div>
                  <p className="font-bold text-foreground">{blockedUser.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(blockedUser.blockedAt).toLocaleDateString('ja-JP')} にブロック
                  </p>
                </div>
              </div>
              <UnblockButton blockedId={blockedUser.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
