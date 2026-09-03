'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import { reportUserSchema } from '@/lib/validations/report';

export async function reportUserAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = reportUserSchema.safeParse({
    reportedId: formData.get('reportedId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: parsed.data.reportedId,
    reason: parsed.data.reason,
  });

  if (error) {
    return err('通報に失敗しました: ' + error.message);
  }

  return ok(undefined);
}
