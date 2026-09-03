import { z } from 'zod';

export const createBadgeDefinitionSchema = z.object({
  label: z.string().trim().min(1, 'ラベルを入力してください').max(50),
  imageUrl: z.url('画像をアップロードしてください'),
});

export const awardBadgeSchema = z.object({
  userId: z.uuid(),
  badgeDefinitionId: z.uuid(),
});
