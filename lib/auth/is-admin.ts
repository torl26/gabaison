import { createClient } from '@/lib/supabase/server';

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('isAdmin: failed to look up profile role', error);
  }

  return profile?.role === 'admin';
}
