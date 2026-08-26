import { z } from 'zod';
import { CATEGORY_KEYS } from '@/lib/constants/categories';

export const matchRequestSchema = z.object({
  mentorId: z.string().uuid('メンターIDが不正です'),
  categoryKey: z.enum(CATEGORY_KEYS, {
    message: 'カテゴリを選択してください',
  }),
  message: z.string().max(1000, 'メッセージは1000文字以内で入力してください').optional(),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
