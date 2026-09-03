'use client';

import { useActionState, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { markMessagesAsRead, sendMessageAction } from './actions';
import type { ChatMessage, MessageRow } from './get-chat';

type Props = {
  matchId: string;
  initialMessages: ChatMessage[];
  participantNames: Record<string, string>;
  currentUserId: string;
  readOnly?: boolean;
};

export function ChatRoom({
  matchId,
  initialMessages,
  participantNames,
  currentUserId,
  readOnly = false,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction, pending] = useActionState(sendMessageAction, null);
  const [handledState, setHandledState] = useState(state);

  function toChatMessage(row: MessageRow): ChatMessage {
    return {
      id: row.id,
      senderId: row.sender_id,
      senderName: participantNames[row.sender_id] ?? '不明なユーザー',
      content: row.content,
      createdAt: row.created_at,
      readAt: row.read_at,
      isOwn: row.sender_id === currentUserId,
    };
  }

  function appendMessage(row: MessageRow) {
    setMessages((current) => {
      if (current.some((message) => message.id === row.id)) {
        return current;
      }
      return [...current, toChatMessage(row)];
    });
    if (row.sender_id !== currentUserId) {
      void markMessagesAsRead(matchId);
    }
  }

  function updateMessageReadState(row: MessageRow) {
    setMessages((current) =>
      current.map((message) =>
        message.id === row.id ? { ...message, readAt: row.read_at } : message
      )
    );
  }

  // Mark any already-unread messages from the other participant as read as
  // soon as this chat is opened.
  useEffect(() => {
    void markMessagesAsRead(matchId);
  }, [matchId]);

  // Append the sender's own message as soon as the action succeeds, instead
  // of waiting for it to round-trip back through the realtime subscription.
  // This adjusts state during render (React's recommended pattern for
  // reacting to a prop/argument change) rather than in a useEffect.
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      appendMessage(state.data);
    }
  }

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
          appendMessage(payload.new as MessageRow);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          updateMessageReadState(payload.new as MessageRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // appendMessage closes over participantNames/currentUserId, which are
    // stable for the lifetime of a chat session; matchId is the only thing
    // that should re-run this subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`flex items-end gap-1 ${message.isOwn ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`max-w-md rounded-2xl p-3 text-sm ${
                message.isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-foreground'
              }`}
            >
              <p className="text-xs opacity-70">{message.senderName}</p>
              <p>{message.content}</p>
            </div>
            {message.isOwn && (
              <span className="shrink-0 text-xs text-muted">
                {message.readAt ? '既読' : '未読'}
              </span>
            )}
          </li>
        ))}
      </ul>

      {readOnly ? (
        <p className="rounded-2xl bg-[#f5c45b]/20 px-4 py-3 text-sm leading-6 text-[#17263d]/65">
          この相談は完了しています。チャット履歴はいつでも確認できます。
        </p>
      ) : (
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="text"
            name="content"
            required
            className="flex-1 rounded-2xl border border-[#17263d]/12 bg-[#fffaf3] px-4 py-3 text-foreground focus:outline-none focus:ring-4 focus:ring-[#e16f4d]/10"
            placeholder="メッセージを入力"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[#e16f4d] px-5 py-3 font-bold text-[#fff8ed] transition hover:-translate-y-0.5 hover:bg-[#cf5f40] disabled:opacity-50"
          >
            送信
          </button>
        </form>
      )}
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </div>
  );
}
