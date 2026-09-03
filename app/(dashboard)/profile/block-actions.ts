'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { blockUserSchema } from '@/lib/validations/block';

export async function blockUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = blockUserSchema.safeParse({
    blockedId: formData.get('blockedId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: parsed.data.blockedId,
  });

  if (error) {
    if (error.code === '23505') {
      return err('すでにブロック済みです');
    }
    return err('ブロックに失敗しました: ' + error.message);
  }

  revalidatePath('/mentors');
  revalidatePath('/chat');
  revalidatePath('/requests');
  revalidatePath('/profile/blocked');
  return ok(undefined);
}

export async function unblockUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = blockUserSchema.safeParse({
    blockedId: formData.get('blockedId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', parsed.data.blockedId);

  if (error) {
    return err('解除に失敗しました: ' + error.message);
  }

  revalidatePath('/profile/blocked');
  return ok(undefined);
}
