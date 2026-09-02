import type { createClient } from '@/lib/supabase/server';
import type { CategoryDefinition } from '@/lib/constants/categories';
import type { ProfileRole } from '@/types/database';

export interface UserProfileRow {
  id: string;
  name: string;
  bio: string;
  role: ProfileRole;
  avatar_url: string | null;
}

export interface UserProfileView {
  id: string;
  name: string;
  bio: string;
  role: ProfileRole;
  avatarUrl: string | null;
  categories: CategoryDefinition[];
}

export function buildUserProfileView(
  profile: UserProfileRow,
  categories: CategoryDefinition[]
): UserProfileView {
  return {
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    categories,
  };
}

export async function fetchUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserProfileView | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, bio, role, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { data: mentorCategories } = await supabase
    .from('mentor_categories')
    .select('category:categories(key, label)')
    .eq('mentor_id', userId);

  const categories = ((mentorCategories ?? []) as unknown as { category: CategoryDefinition }[]).map(
    (row) => row.category
  );

  return buildUserProfileView(profile as UserProfileRow, categories);
}
