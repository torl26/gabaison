import type { createClient } from '@/lib/supabase/server';

export interface AdminStats {
  studentCount: number;
  mentorCount: number;
  pendingRequestCount: number;
  acceptedRequestCount: number;
  rejectedRequestCount: number;
  messageCount: number;
}

export async function fetchAdminStats(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminStats> {
  const [
    { count: studentCount },
    { count: mentorCount },
    { count: pendingRequestCount },
    { count: acceptedRequestCount },
    { count: rejectedRequestCount },
    { count: messageCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    supabase
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
  ]);

  return {
    studentCount: studentCount ?? 0,
    mentorCount: mentorCount ?? 0,
    pendingRequestCount: pendingRequestCount ?? 0,
    acceptedRequestCount: acceptedRequestCount ?? 0,
    rejectedRequestCount: rejectedRequestCount ?? 0,
    messageCount: messageCount ?? 0,
  };
}
