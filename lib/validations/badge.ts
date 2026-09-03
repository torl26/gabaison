import { z } from 'zod';

export const createBadgeDefinitionSchema = z.object({
  label: z.string().trim().min(1, 'ラベルを入力してください').max(50),
  icon: z.string().trim().min(1, 'アイコンを入力してください').max(8),
});
