import { z } from 'zod';
import { CATEGORY_KEYS } from '@/lib/constants/categories';
import {
  MAX_SKILLS,
  MAX_SKILL_LENGTH,
  MAX_TOPICS,
  MAX_TOPIC_LENGTH,
} from '@/lib/profile/parse-list-input';

const optionalUrl = z
  .url({ protocol: /^https$/, message: 'URLはhttps://で始まる形式で入力してください' })
  .optional();

export const profileSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(50, '表示名は50文字以内で入力してください'),
  bio: z.string().max(1000, '自己紹介は1000文字以内で入力してください'),
  avatarUrl: z
    .url({ protocol: /^https?$/, message: 'URLの形式が正しくありません' })
    .optional(),
  categoryKeys: z.array(z.enum(CATEGORY_KEYS)).optional(),
  headline: z.string().max(60, 'ひとことは60文字以内で入力してください').default(''),
  affiliation: z.string().max(100, '所属は100文字以内で入力してください').default(''),
  title: z.string().max(50, '学年・職種は50文字以内で入力してください').default(''),
  experienceYears: z
    .number()
    .int('経験年数は整数で入力してください')
    .min(0, '経験年数は0以上で入力してください')
    .max(80, '経験年数は80以下で入力してください')
    .nullable()
    .default(null),
  availability: z
    .string()
    .max(100, '対応可能な時間帯は100文字以内で入力してください')
    .default(''),
  accepting: z.boolean().default(true),
  skills: z
    .array(z.string().max(MAX_SKILL_LENGTH))
    .max(MAX_SKILLS, `スキルタグは${MAX_SKILLS}個以内で入力してください`)
    .default([]),
  topics: z
    .array(z.string().max(MAX_TOPIC_LENGTH))
    .max(MAX_TOPICS, `相談できることは${MAX_TOPICS}件以内で入力してください`)
    .default([]),
  githubUrl: optionalUrl,
  xUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;
