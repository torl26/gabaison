import type { createClient } from '@/lib/supabase/server';

export interface UnreadRow {
  match_id: string;
}

export function countUnreadByMatch(rows: UnreadRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.match_id] = (counts[row.match_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchUnreadCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  matchIds: string[]
): Promise<Record<string, number>> {
  if (matchIds.length === 0) {
    return {};
  }

  const { data } = await supabase
    .from('messages')
    .select('match_id')
    .in('match_id', matchIds)
    .neq('sender_id', userId)
    .is('read_at', null);

  return countUnreadByMatch((data ?? []) as UnreadRow[]);
}
