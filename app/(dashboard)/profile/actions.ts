'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { ok, err } from '@/lib/actions/types';
import { profileSchema } from '@/lib/validations/profile';

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
    avatarUrl: formData.get('avatarUrl') || undefined,
    categoryKeys: formData.getAll('categoryKeys'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const { name, bio, avatarUrl, categoryKeys } = parsed.data;
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ name, bio, avatar_url: avatarUrl ?? null })
    .eq('id', user.id);

  if (updateError) {
    return err('保存に失敗しました: ' + updateError.message);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'mentor') {
    await supabase.from('mentor_categories').delete().eq('mentor_id', user.id);

    if (categoryKeys && categoryKeys.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, key')
        .in('key', categoryKeys);

      if (categories && categories.length > 0) {
        const rows = categories.map((c) => ({
          mentor_id: user.id,
          category_id: c.id,
        }));
        const { error: insertError } = await supabase.from('mentor_categories').insert(rows);
        if (insertError) {
          return err('カテゴリの保存に失敗しました: ' + insertError.message);
        }
      }
    }
  }

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return ok(undefined);
}