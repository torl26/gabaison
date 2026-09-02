import type { createClient } from '@/lib/supabase/server';
import type { CategoryDefinition, CategoryKey } from '@/lib/constants/categories';
import type { MatchRequestStatus } from '@/types/database';

export interface MatchRequestRow {
  id: string;
  student_id: string;
  mentor_id: string;
  category_id: number;
  status: MatchRequestStatus;
  message: string | null;
  created_at: string;
}

export interface ProfileNameRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface CategoryRow {
  id: number;
  key: CategoryKey;
  label: string;
}

export interface MatchRequestSummary {
  id: string;
  status: MatchRequestStatus;
  message: string | null;
  createdAt: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  category: CategoryDefinition;
  isMentor: boolean;
}

export function buildMatchRequestSummaries(
  requests: MatchRequestRow[],
  profiles: ProfileNameRow[],
  categories: CategoryRow[],
  currentUserId: string
): MatchRequestSummary[] {
  const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const avatarUrlById = new Map(profiles.map((profile) => [profile.id, profile.avatar_url]));
  const categoryById = new Map(
    categories.map((category) => [category.id, { key: category.key, label: category.label }])
  );

  return requests.map((request) => {
    const isMentor = request.mentor_id === currentUserId;
    const counterpartId = isMentor ? request.student_id : request.mentor_id;

    return {
      id: request.id,
      status: request.status,
      message: request.message,
      createdAt: request.created_at,
      counterpartId,
      counterpartName: nameById.get(counterpartId) ?? '不明なユーザー',
      counterpartAvatarUrl: avatarUrlById.get(counterpartId) ?? null,
      category: categoryById.get(request.category_id) ?? { key: 'career', label: '不明' },
      isMentor,
    };
  });
}

export async function fetchMatchRequests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<MatchRequestSummary[]> {
  const { data: requests } = await supabase
    .from('match_requests')
    .select('id, student_id, mentor_id, category_id, status, message, created_at')
    .or(`student_id.eq.${userId},mentor_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  const rows = (requests ?? []) as MatchRequestRow[];

  const profileIds = Array.from(
    new Set(rows.flatMap((row) => [row.student_id, row.mentor_id]))
  );

  const [{ data: profiles }, { data: categories }] = await Promise.all([
    profileIds.length > 0
      ? supabase.from('profiles').select('id, name, avatar_url').in('id', profileIds)
      : Promise.resolve({ data: [] as ProfileNameRow[] }),
    supabase.from('categories').select('id, key, label'),
  ]);

  return buildMatchRequestSummaries(
    rows,
    (profiles ?? []) as ProfileNameRow[],
    (categories ?? []) as CategoryRow[],
    userId
  );
}
