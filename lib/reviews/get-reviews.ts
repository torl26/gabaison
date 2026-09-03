import type { createClient } from '@/lib/supabase/server';

export interface ReviewRow {
  id: string;
  match_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewerRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface ReviewSummary {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
}

export interface ReviewStats {
  count: number;
  /** Mean rating rounded to one decimal, or null when there are no reviews. */
  average: number | null;
}

export function buildReviewStats(rows: Pick<ReviewRow, 'rating'>[]): ReviewStats {
  if (rows.length === 0) {
    return { count: 0, average: null };
  }

  const total = rows.reduce((sum, row) => sum + row.rating, 0);

  return {
    count: rows.length,
    average: Math.round((total / rows.length) * 10) / 10,
  };
}

export function buildReviewSummaries(
  rows: ReviewRow[],
  reviewers: ReviewerRow[]
): ReviewSummary[] {
  const reviewerById = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]));

  return rows.map((row) => {
    const reviewer = reviewerById.get(row.reviewer_id);

    return {
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      reviewerName: reviewer?.name ?? '不明なユーザー',
      reviewerAvatarUrl: reviewer?.avatar_url ?? null,
    };
  });
}

export async function fetchReviewsFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  revieweeId: string
): Promise<{ stats: ReviewStats; reviews: ReviewSummary[] }> {
  const { data } = await supabase
    .from('reviews')
    .select('id, match_id, reviewer_id, rating, comment, created_at')
    .eq('reviewee_id', revieweeId)
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as ReviewRow[];
  const reviewerIds = Array.from(new Set(rows.map((row) => row.reviewer_id)));

  const { data: reviewers } = reviewerIds.length
    ? await supabase.from('profiles').select('id, name, avatar_url').in('id', reviewerIds)
    : { data: [] as ReviewerRow[] };

  return {
    stats: buildReviewStats(rows),
    reviews: buildReviewSummaries(rows, (reviewers ?? []) as ReviewerRow[]),
  };
}

/** Match ids the given user has already reviewed, so the form is only shown once. */
export async function fetchReviewedMatchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reviewerId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('reviews')
    .select('match_id')
    .eq('reviewer_id', reviewerId);

  return new Set(((data ?? []) as { match_id: string }[]).map((row) => row.match_id));
}
