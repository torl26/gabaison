import { z } from 'zod';
import { CATEGORY_KEYS } from '@/lib/constants/categories';

export const profileSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(50, '表示名は50文字以内で入力してください'),
  bio: z.string().max(1000, '自己紹介は1000文字以内で入力してください'),
  avatarUrl: z
    .url({ protocol: /^https?$/, message: 'URLの形式が正しくありません' })
    .optional(),
  categoryKeys: z.array(z.enum(CATEGORY_KEYS)).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
