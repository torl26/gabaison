import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, type CurrentUser } from './get-current-user';

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/home');
  }

  return user;
}
