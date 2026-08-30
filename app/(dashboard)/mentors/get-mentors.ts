import type { createClient } from '@/lib/supabase/server';
import type { CategoryDefinition, CategoryKey } from '@/lib/constants/categories';

export interface MentorProfileRow {
  id: string;
  name: string;
  bio: string;
}

export interface MentorCategoryRow {
  mentor_id: string;
  category: CategoryDefinition;
}

export interface MentorSummary {
  id: string;
  name: string;
  bio: string;
  categories: CategoryDefinition[];
}

export function buildMentorSummaries(
  profiles: MentorProfileRow[],
  mentorCategories: MentorCategoryRow[],
  categoryFilter?: CategoryKey
): MentorSummary[] {
  const categoriesByMentorId = new Map<string, CategoryDefinition[]>();
  for (const row of mentorCategories) {
    const categories = categoriesByMentorId.get(row.mentor_id) ?? [];
    categories.push(row.category);
    categoriesByMentorId.set(row.mentor_id, categories);
  }

  return profiles
    .map((profile) => ({
      ...profile,
      categories: categoriesByMentorId.get(profile.id) ?? [],
    }))
    .filter(
      (mentor) =>
        !categoryFilter ||
        mentor.categories.some((category) => category.key === categoryFilter)
    );
}

export async function fetchMentors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryFilter?: CategoryKey
): Promise<MentorSummary[]> {
  const [{ data: profiles }, { data: mentorCategories }] = await Promise.all([
    supabase.from('profiles').select('id, name, bio').eq('role', 'mentor'),
    supabase
      .from('mentor_categories')
      .select('mentor_id, category:categories(key, label)'),
  ]);

  return buildMentorSummaries(
    profiles ?? [],
    (mentorCategories ?? []) as unknown as MentorCategoryRow[],
    categoryFilter
  );
}
