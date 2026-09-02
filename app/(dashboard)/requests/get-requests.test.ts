import { describe, expect, it } from 'vitest';
import { buildMatchRequestSummaries } from './get-requests';

const CURRENT_USER_ID = 'user-1';

const requests = [
  {
    id: 'req-1',
    student_id: CURRENT_USER_ID,
    mentor_id: 'mentor-1',
    category_id: 1,
    status: 'pending' as const,
    message: 'よろしくお願いします',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'req-2',
    student_id: 'student-2',
    mentor_id: CURRENT_USER_ID,
    category_id: 2,
    status: 'accepted' as const,
    message: null,
    created_at: '2026-08-02T00:00:00Z',
  },
];

const profiles = [
  { id: CURRENT_USER_ID, name: '自分' },
  { id: 'mentor-1', name: 'タロウ' },
  { id: 'student-2', name: 'ジロウ' },
];

const categories = [
  { id: 1, key: 'career' as const, label: 'キャリア相談' },
  { id: 2, key: 'skill' as const, label: 'スキル/技術メンタリング' },
];

describe('buildMatchRequestSummaries', () => {
  it('resolves the counterpart name (the other party, not the current user)', () => {
    const result = buildMatchRequestSummaries(
      requests,
      profiles,
      categories,
      CURRENT_USER_ID
    );

    expect(result[0].counterpartName).toBe('タロウ');
    expect(result[1].counterpartName).toBe('ジロウ');
  });

  it('resolves the counterpart id (the other party, not the current user)', () => {
    const result = buildMatchRequestSummaries(
      requests,
      profiles,
      categories,
      CURRENT_USER_ID
    );

    expect(result[0].counterpartId).toBe('mentor-1');
    expect(result[1].counterpartId).toBe('student-2');
  });

  it('marks whether the current user is the mentor on each request', () => {
    const result = buildMatchRequestSummaries(
      requests,
      profiles,
      categories,
      CURRENT_USER_ID
    );

    expect(result[0].isMentor).toBe(false);
    expect(result[1].isMentor).toBe(true);
  });

  it('attaches the resolved category', () => {
    const result = buildMatchRequestSummaries(
      requests,
      profiles,
      categories,
      CURRENT_USER_ID
    );

    expect(result[0].category).toEqual({ key: 'career', label: 'キャリア相談' });
    expect(result[1].category).toEqual({ key: 'skill', label: 'スキル/技術メンタリング' });
  });

  it('carries through id, status, message, and createdAt', () => {
    const result = buildMatchRequestSummaries(
      requests,
      profiles,
      categories,
      CURRENT_USER_ID
    );

    expect(result[0]).toMatchObject({
      id: 'req-1',
      status: 'pending',
      message: 'よろしくお願いします',
      createdAt: '2026-08-01T00:00:00Z',
    });
    expect(result[1]).toMatchObject({
      id: 'req-2',
      status: 'accepted',
      message: null,
      createdAt: '2026-08-02T00:00:00Z',
    });
  });
});
