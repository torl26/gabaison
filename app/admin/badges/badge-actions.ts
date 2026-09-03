'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { createBadgeDefinitionSchema } from '@/lib/validations/badge';

export async function createBadgeDefinitionAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const admin = await requireAdmin();

  const parsed = createBadgeDefinitionSchema.safeParse({
    label: formData.get('label'),
    icon: formData.get('icon'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('badge_definitions').insert({
    slug: crypto.randomUUID(),
    label: parsed.data.label,
    icon: parsed.data.icon,
    source: 'manual',
    created_by: admin.id,
  });

  if (error) {
    return err('バッジの作成に失敗しました: ' + error.message);
  }

  revalidatePath('/admin/badges');
  return ok(undefined);
}
