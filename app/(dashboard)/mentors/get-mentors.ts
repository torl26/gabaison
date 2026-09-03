import type { createClient } from '@/lib/supabase/server';
import type { CategoryDefinition, CategoryKey } from '@/lib/constants/categories';
import {
  PROFILE_COLUMNS,
  buildUserProfileView,
  type UserProfileRow,
  type UserProfileView,
} from '@/lib/profile/get-user-profile';

export type MentorProfileRow = UserProfileRow;

export interface MentorCategoryRow {
  mentor_id: string;
  category: CategoryDefinition;
}

/** A mentor is shown with the same fields as any other profile. */
export type MentorSummary = UserProfileView;

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
    .map((profile) =>
      buildUserProfileView(profile, categoriesByMentorId.get(profile.id) ?? [])
    )
    .filter(
      (mentor) =>
        !categoryFilter ||
        mentor.categories.some((category) => category.key === categoryFilter)
    );
}

export function excludeMentorsWithoutCategories(mentors: MentorSummary[]): MentorSummary[] {
  return mentors.filter((mentor) => mentor.categories.length > 0);
}

export async function fetchMentors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryFilter?: CategoryKey
): Promise<MentorSummary[]> {
  const [{ data: profiles }, { data: mentorCategories }] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('role', 'mentor'),
    supabase
      .from('mentor_categories')
      .select('mentor_id, category:categories(key, label)'),
  ]);

  const summaries = buildMentorSummaries(
    (profiles ?? []) as unknown as MentorProfileRow[],
    (mentorCategories ?? []) as unknown as MentorCategoryRow[],
    categoryFilter
  );

  return excludeMentorsWithoutCategories(summaries);
}

export async function fetchMentorById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mentorId: string
): Promise<MentorSummary | null> {
  const [{ data: profile }, { data: mentorCategories }] = await Promise.all([
    supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('role', 'mentor')
      .eq('id', mentorId)
      .maybeSingle(),
    supabase
      .from('mentor_categories')
      .select('mentor_id, category:categories(key, label)')
      .eq('mentor_id', mentorId),
  ]);

  if (!profile) {
    return null;
  }

  return buildMentorSummaries(
    [profile as unknown as MentorProfileRow],
    (mentorCategories ?? []) as unknown as MentorCategoryRow[]
  )[0];
}
