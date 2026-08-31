'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { matchRequestSchema } from '@/lib/validations/match-request';
import { type ActionResult, ok, err } from '@/lib/actions/types';

export async function requestMatchAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = matchRequestSchema.safeParse({
    mentorId: formData.get('mentorId'),
    categoryKey: formData.get('categoryKey'),
    message: formData.get('message') || undefined,
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('key', parsed.data.categoryKey)
    .single();

  if (!category) {
    return err('カテゴリが見つかりません');
  }

  const { error } = await supabase.from('match_requests').insert({
    student_id: user.id,
    mentor_id: parsed.data.mentorId,
    category_id: category.id,
    message: parsed.data.message,
  });

  if (error) {
    return err('申請に失敗しました: ' + error.message);
  }

  return ok(undefined);
}
