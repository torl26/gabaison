import { describe, expect, it } from 'vitest';
import { buildReviewStats, buildReviewSummaries, type ReviewRow } from './get-reviews';

function reviewRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    id: 'review-1',
    match_id: 'match-1',
    reviewer_id: 'student-1',
    rating: 5,
    comment: 'とても分かりやすかったです',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildReviewStats', () => {
  it('reports no average when there are no reviews', () => {
    expect(buildReviewStats([])).toEqual({ count: 0, average: null });
  });

  it('averages the ratings and rounds to one decimal', () => {
    const stats = buildReviewStats([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);

    expect(stats).toEqual({ count: 3, average: 4.3 });
  });

  it('keeps a whole-number average whole', () => {
    expect(buildReviewStats([{ rating: 4 }, { rating: 4 }]).average).toBe(4);
  });
});

describe('buildReviewSummaries', () => {
  it('attaches the reviewer name and avatar', () => {
    const result = buildReviewSummaries(
      [reviewRow()],
      [{ id: 'student-1', name: 'ハナコ', avatar_url: 'https://example.test/h.png' }]
    );

    expect(result).toEqual([
      {
        id: 'review-1',
        rating: 5,
        comment: 'とても分かりやすかったです',
        createdAt: '2026-01-01T00:00:00Z',
        reviewerName: 'ハナコ',
        reviewerAvatarUrl: 'https://example.test/h.png',
      },
    ]);
  });

  it('falls back to a placeholder when the reviewer profile is missing', () => {
    const result = buildReviewSummaries([reviewRow({ reviewer_id: 'gone' })], []);

    expect(result[0].reviewerName).toBe('不明なユーザー');
    expect(result[0].reviewerAvatarUrl).toBeNull();
  });

  it('preserves the order it was given', () => {
    const result = buildReviewSummaries(
      [reviewRow({ id: 'a' }), reviewRow({ id: 'b' })],
      []
    );

    expect(result.map((review) => review.id)).toEqual(['a', 'b']);
  });
});
