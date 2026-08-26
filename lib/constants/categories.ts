export const CATEGORY_KEYS = ['career', 'skill', 'project', 'academic'] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  career: 'キャリア相談',
  skill: 'スキル/技術メンタリング',
  project: 'プロジェクト支援',
  academic: '学業/研究支援',
};

export const CATEGORIES: CategoryDefinition[] = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));
