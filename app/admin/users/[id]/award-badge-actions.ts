'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { awardBadgeSchema } from '@/lib/validations/badge';

export async function awardBadgeAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const admin = await requireAdmin();

  const parsed = awardBadgeSchema.safeParse({
    userId: formData.get('userId'),
    badgeDefinitionId: formData.get('badgeDefinitionId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('user_badges').insert({
    user_id: parsed.data.userId,
    badge_definition_id: parsed.data.badgeDefinitionId,
    awarded_by: admin.id,
  });

  if (error) {
    if (error.code === '23505') {
      return err('すでに付与済みです');
    }
    return err('バッジの付与に失敗しました: ' + error.message);
  }

  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return ok(undefined);
}
