'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { respondToRequestSchema } from '@/lib/validations/respond-to-request';
import { cancelRequestSchema } from '@/lib/validations/cancel-request';
import { type ActionResult, ok, err } from '@/lib/actions/types';

export async function respondToMatchRequestAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = respondToRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('match_requests')
    .update({ status: parsed.data.decision })
    .eq('id', parsed.data.requestId);

  if (error) {
    return err('更新に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  return ok(undefined);
}

export async function cancelMatchRequestAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = cancelRequestSchema.safeParse({
    requestId: formData.get('requestId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data.requestId);

  if (error) {
    return err('更新に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  return ok(undefined);
}