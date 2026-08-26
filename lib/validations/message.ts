import { z } from 'zod';

export const messageSchema = z.object({
  matchId: z.string().uuid('マッチングIDが不正です'),
  content: z
    .string()
    .min(1, 'メッセージを入力してください')
    .max(2000, 'メッセージは2000文字以内で入力してください'),
});

export type MessageInput = z.infer<typeof messageSchema>;
