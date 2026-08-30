'use client';

import { useActionState, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction } from './actions';
import type { ChatMessage, MessageRow } from './get-chat';

type Props = {
  matchId: string;
  initialMessages: ChatMessage[];
  participantNames: Record<string, string>;
  currentUserId: string;
};

export function ChatRoom({
  matchId,
  initialMessages,
  participantNames,
  currentUserId,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction, pending] = useActionState(sendMessageAction, null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((current) => {
            if (current.some((message) => message.id === row.id)) {
              return current;
            }
            return [
              ...current,
              {
                id: row.id,
                senderId: row.sender_id,
                senderName: participantNames[row.sender_id] ?? '不明なユーザー',
                content: row.content,
                createdAt: row.created_at,
                isOwn: row.sender_id === currentUserId,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, participantNames, currentUserId]);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`max-w-md rounded p-2 text-sm ${
              message.isOwn ? 'ml-auto bg-black text-white' : 'bg-gray-100'
            }`}
          >
            <p className="text-xs opacity-70">{message.senderName}</p>
            <p>{message.content}</p>
          </li>
        ))}
      </ul>

      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="matchId" value={matchId} />
        <input
          type="text"
          name="content"
          required
          className="flex-1 rounded border px-3 py-2"
          placeholder="メッセージを入力"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          送信
        </button>
      </form>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </div>
  );
}
