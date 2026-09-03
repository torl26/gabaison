import { z } from 'zod';

export const completeRequestSchema = z.object({
  requestId: z.uuid(),
});

export const reviewSchema = z.object({
  requestId: z.uuid(),
  rating: z
    .number()
    .int('評価を選択してください')
    .min(1, '評価を選択してください')
    .max(5, '評価は5段階で入力してください'),
  comment: z.string().max(500, 'コメントは500文字以内で入力してください'),
});
