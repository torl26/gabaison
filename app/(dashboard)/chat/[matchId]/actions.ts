'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { messageSchema } from '@/lib/validations/message';
import { type ActionResult, ok, err } from '@/lib/actions/types';
import type { MessageRow } from './get-chat';

export async function sendMessageAction(
  _prevState: ActionResult<MessageRow> | null,
  formData: FormData
): Promise<ActionResult<MessageRow>> {
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

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: parsed.data.matchId,
      sender_id: user.id,
      content: parsed.data.content,
    })
    .select('id, match_id, sender_id, content, created_at')
    .single();

  if (error || !data) {
    return err('送信に失敗しました: ' + (error?.message ?? '不明なエラー'));
  }

  return ok(data as MessageRow);
}
