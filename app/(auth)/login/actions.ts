'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/actions/types';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return err('メールアドレスとパスワードを入力してください');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return err('ログインに失敗しました: ' + error.message);
  }

  redirect('/profile');
}