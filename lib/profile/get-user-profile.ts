import type { createClient } from '@/lib/supabase/server';
import type { CategoryDefinition } from '@/lib/constants/categories';
import type { ProfileRole } from '@/types/database';

export interface UserProfileRow {
  id: string;
  name: string;
  bio: string;
  role: ProfileRole;
  avatar_url: string | null;
  headline: string;
  affiliation: string;
  title: string;
  experience_years: number | null;
  availability: string;
  accepting: boolean;
  skills: string[];
  topics: string[];
  github_url: string | null;
  x_url: string | null;
  website_url: string | null;
  alma_mater: string;
  alma_mater_department: string;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface UserProfileView {
  id: string;
  name: string;
  bio: string;
  role: ProfileRole;
  avatarUrl: string | null;
  categories: CategoryDefinition[];
  headline: string;
  affiliation: string;
  title: string;
  experienceYears: number | null;
  availability: string;
  accepting: boolean;
  skills: string[];
  topics: string[];
  links: ProfileLink[];
  almaMater: string;
  almaMaterDepartment: string;
}

export const PROFILE_COLUMNS =
  'id, name, bio, role, avatar_url, headline, affiliation, title, experience_years, availability, accepting, skills, topics, github_url, x_url, website_url, alma_mater, alma_mater_department';

export function buildProfileLinks(profile: {
  github_url: string | null;
  x_url: string | null;
  website_url: string | null;
}): ProfileLink[] {
  return [
    { label: 'GitHub', url: profile.github_url },
    { label: 'X', url: profile.x_url },
    { label: 'Webサイト', url: profile.website_url },
  ].filter((link): link is ProfileLink => Boolean(link.url));
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
    headline: profile.headline,
    affiliation: profile.affiliation,
    title: profile.title,
    experienceYears: profile.experience_years,
    availability: profile.availability,
    accepting: profile.accepting,
    skills: profile.skills ?? [],
    topics: profile.topics ?? [],
    links: buildProfileLinks(profile),
    almaMater: profile.alma_mater,
    almaMaterDepartment: profile.alma_mater_department,
  };
}

export async function fetchUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserProfileView | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
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

  return buildUserProfileView(profile as unknown as UserProfileRow, categories);
}
