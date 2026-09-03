import type { createClient } from '@/lib/supabase/server';
import type { MatchRequestStatus } from '@/types/database';

export interface MatchRequestStatRow {
  status: MatchRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface MentorStats {
  /** Requests this mentor accepted. */
  acceptedCount: number;
  /** Requests the mentor answered either way. */
  respondedCount: number;
  /** Requests still waiting on the mentor. */
  pendingCount: number;
  /** Percentage of requests that needed an answer and got one, or null when there were none. */
  responseRate: number | null;
  /**
   * Mean hours between a request arriving and the mentor answering it.
   *
   * Uses updated_at as the answer time: status changes are the only update the
   * app makes to a match_request, so this is exact today and would only drift
   * if other columns became editable.
   */
  averageResponseHours: number | null;
}

const RESPONDED_STATUSES: MatchRequestStatus[] = ['accepted', 'rejected'];

export function buildMentorStats(rows: MatchRequestStatRow[]): MentorStats {
  const responded = rows.filter((row) => RESPONDED_STATUSES.includes(row.status));
  const pending = rows.filter((row) => row.status === 'pending');
  // A cancelled request was withdrawn by the student, so it never needed an answer.
  const needingAnswer = responded.length + pending.length;

  const responseHours = responded
    .map((row) => (Date.parse(row.updated_at) - Date.parse(row.created_at)) / 3_600_000)
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  const averageResponseHours =
    responseHours.length > 0
      ? Math.round((responseHours.reduce((a, b) => a + b, 0) / responseHours.length) * 10) / 10
      : null;

  return {
    acceptedCount: rows.filter((row) => row.status === 'accepted').length,
    respondedCount: responded.length,
    pendingCount: pending.length,
    responseRate: needingAnswer > 0 ? Math.round((responded.length / needingAnswer) * 100) : null,
    averageResponseHours,
  };
}

/** "1時間以内" / "3時間" / "2日" — a rough, human-readable response time. */
export function formatResponseTime(hours: number | null): string | null {
  if (hours === null) {
    return null;
  }
  if (hours < 1) {
    return '1時間以内';
  }
  if (hours < 24) {
    return `約${Math.round(hours)}時間`;
  }
  return `約${Math.round(hours / 24)}日`;
}

export async function fetchMentorStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mentorId: string
): Promise<MentorStats> {
  const { data } = await supabase
    .from('match_requests')
    .select('status, created_at, updated_at')
    .eq('mentor_id', mentorId);

  return buildMentorStats((data ?? []) as MatchRequestStatRow[]);
}
