import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { buildChatMessages, fetchChatContext, fetchMessages } from './get-chat';
import { ChatRoom } from './chat-room';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { matchId } = await params;
  const supabase = await createClient();
  const context = await fetchChatContext(supabase, matchId, user.id);

  if (!context) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">チャット</h1>
        <p className="mt-2 text-sm text-muted">見つかりません</p>
      </div>
    );
  }

  if (context.status !== 'accepted') {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">チャット</h1>
        <p className="mt-2 text-sm text-muted">
          このマッチングはまだ承認されていません
        </p>
      </div>
    );
  }

  const messages = await fetchMessages(supabase, matchId);
  const chatMessages = buildChatMessages(messages, context.participantNames, user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{context.counterpartName}さんとのチャット</h1>
      <ChatRoom
        matchId={matchId}
        initialMessages={chatMessages}
        participantNames={context.participantNames}
        currentUserId={user.id}
      />
    </div>
  );
}
