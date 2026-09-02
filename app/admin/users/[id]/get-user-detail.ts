import type { createClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/types/database';

export interface UserDetail {
  id: string;
  name: string;
  role: ProfileRole;
  bio: string;
  createdAt: string;
  messageCount: number;
}

export interface UserProfileRow {
  id: string;
  name: string;
  role: ProfileRole;
  bio: string;
  created_at: string;
}

export function buildUserDetail(profile: UserProfileRow, messageCount: number): UserDetail {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    createdAt: profile.created_at,
    messageCount,
  };
}

export async function fetchUserDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserDetail | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, bio, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId);

  return buildUserDetail(profile as UserProfileRow, count ?? 0);
}
