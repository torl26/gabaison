import { redirect } from 'next/navigation';
import { getCurrentUser, type CurrentUser } from './get-current-user';
import { isAdmin } from './is-admin';

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!(await isAdmin(user.id))) {
    redirect('/home');
  }

  return user;
}
