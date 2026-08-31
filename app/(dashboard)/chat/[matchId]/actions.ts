'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { messageSchema } from '@/lib/validations/message';
import { type ActionResult, ok, err } from '@/lib/actions/types';

export async function sendMessageAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = messageSchema.safeParse({
    matchId: formData.get('matchId'),
    content: formData.get('content'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('messages').insert({
    match_id: parsed.data.matchId,
    sender_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    return err('送信に失敗しました: ' + error.message);
  }

  return ok(undefined);
}
