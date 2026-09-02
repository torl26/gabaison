import { describe, expect, it } from 'vitest';
import { buildUserDetail } from './get-user-detail';

describe('buildUserDetail', () => {
  it('combines the profile row and message count into a UserDetail', () => {
    const result = buildUserDetail(
      {
        id: 'user-1',
        name: 'タロウ',
        role: 'mentor',
        bio: 'よろしくお願いします',
        created_at: '2026-08-01T00:00:00Z',
      },
      5
    );

    expect(result).toEqual({
      id: 'user-1',
      name: 'タロウ',
      role: 'mentor',
      bio: 'よろしくお願いします',
      createdAt: '2026-08-01T00:00:00Z',
      messageCount: 5,
    });
  });

  it('keeps a message count of zero rather than treating it as missing', () => {
    const result = buildUserDetail(
      {
        id: 'user-2',
        name: 'ハナコ',
        role: 'student',
        bio: '',
        created_at: '2026-08-02T00:00:00Z',
      },
      0
    );

    expect(result.messageCount).toBe(0);
  });
});
