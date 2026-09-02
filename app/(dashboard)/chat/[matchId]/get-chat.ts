import type { createClient } from '@/lib/supabase/server';
import type { MatchRequestStatus } from '@/types/database';

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isOwn: boolean;
}

export function buildChatMessages(
  messages: MessageRow[],
  participantNames: Record<string, string>,
  currentUserId: string
): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    senderName: participantNames[message.sender_id] ?? '不明なユーザー',
    content: message.content,
    createdAt: message.created_at,
    readAt: message.read_at,
    isOwn: message.sender_id === currentUserId,
  }));
}

export interface ChatContext {
  matchId: string;
  status: MatchRequestStatus;
  participantNames: Record<string, string>;
  counterpartName: string;
}

export async function fetchChatContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchId: string,
  userId: string
): Promise<ChatContext | null> {
  const { data: matchRequest } = await supabase
    .from('match_requests')
    .select('id, student_id, mentor_id, status')
    .eq('id', matchId)
    .maybeSingle();

  if (
    !matchRequest ||
    (matchRequest.student_id !== userId && matchRequest.mentor_id !== userId)
  ) {
    return null;
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', [matchRequest.student_id, matchRequest.mentor_id]);

  const participantNames = Object.fromEntries(
    (profiles ?? []).map((profile) => [profile.id, profile.name])
  );

  const counterpartId =
    matchRequest.mentor_id === userId ? matchRequest.student_id : matchRequest.mentor_id;

  return {
    matchId: matchRequest.id,
    status: matchRequest.status,
    participantNames,
    counterpartName: participantNames[counterpartId] ?? '不明なユーザー',
  };
}

export async function fetchMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchId: string
): Promise<MessageRow[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, content, created_at, read_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return (data ?? []) as MessageRow[];
}
