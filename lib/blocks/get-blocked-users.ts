import type { createClient } from '@/lib/supabase/server';

export interface BlockedUserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  blockedAt: string;
}

interface BlockedProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  blocked_at: string;
}

export async function fetchBlockedUsers(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BlockedUserSummary[]> {
  const { data } = await supabase.rpc('get_blocked_profiles');
  const rows = (data ?? []) as unknown as BlockedProfileRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    blockedAt: row.blocked_at,
  }));
}
