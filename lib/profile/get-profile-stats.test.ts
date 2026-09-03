import { describe, expect, it } from 'vitest';
import {
  buildMentorStats,
  formatResponseTime,
  type MatchRequestStatRow,
} from './get-profile-stats';

function row(
  status: MatchRequestStatRow['status'],
  createdAt = '2026-01-01T00:00:00Z',
  updatedAt = createdAt
): MatchRequestStatRow {
  return { status, created_at: createdAt, updated_at: updatedAt };
}

describe('buildMentorStats', () => {
  it('returns empty stats when there are no requests', () => {
    expect(buildMentorStats([])).toEqual({
      acceptedCount: 0,
      respondedCount: 0,
      pendingCount: 0,
      responseRate: null,
      averageResponseHours: null,
    });
  });

  it('counts accepted, responded, and pending requests', () => {
    const stats = buildMentorStats([
      row('accepted'),
      row('accepted'),
      row('rejected'),
      row('pending'),
    ]);

    expect(stats.acceptedCount).toBe(2);
    expect(stats.respondedCount).toBe(3);
    expect(stats.pendingCount).toBe(1);
  });

  it('computes the response rate over requests that needed an answer', () => {
    const stats = buildMentorStats([row('accepted'), row('rejected'), row('pending')]);

    expect(stats.responseRate).toBe(67);
  });

  it('excludes cancelled requests from the response rate', () => {
    const stats = buildMentorStats([row('accepted'), row('cancelled'), row('cancelled')]);

    expect(stats.responseRate).toBe(100);
  });

  it('averages the response time of answered requests only', () => {
    const stats = buildMentorStats([
      row('accepted', '2026-01-01T00:00:00Z', '2026-01-01T02:00:00Z'),
      row('rejected', '2026-01-01T00:00:00Z', '2026-01-01T04:00:00Z'),
      row('pending', '2026-01-01T00:00:00Z', '2026-01-01T99:00:00Z'),
    ]);

    expect(stats.averageResponseHours).toBe(3);
  });

  it('ignores rows whose timestamps cannot be parsed', () => {
    const stats = buildMentorStats([
      row('accepted', 'not-a-date', 'also-not-a-date'),
      row('accepted', '2026-01-01T00:00:00Z', '2026-01-01T05:00:00Z'),
    ]);

    expect(stats.averageResponseHours).toBe(5);
  });
});

describe('formatResponseTime', () => {
  it.each([
    [null, null],
    [0.5, '1時間以内'],
    [3.2, '約3時間'],
    [48, '約2日'],
  ])('formats %s as %s', (hours, expected) => {
    expect(formatResponseTime(hours)).toBe(expected);
  });
});
