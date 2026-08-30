import { createClient } from '@/lib/supabase/server';

export interface CurrentUser {
  id: string;
  email: string | null;
}

const DEV_USER: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@example.com',
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (
    process.env.SKIP_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    return DEV_USER;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
}
