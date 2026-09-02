import type { createClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/types/database';

export interface AdminUserRow {
  id: string;
  name: string;
  role: ProfileRole;
  createdAt: string;
}

export async function fetchAllUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleFilter?: ProfileRole
): Promise<AdminUserRow[]> {
  let query = supabase
    .from('profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: false });

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  }));
}
