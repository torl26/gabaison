import { describe, expect, it } from 'vitest';
import { buildUserProfileView } from './get-user-profile';

describe('buildUserProfileView', () => {
  it('combines the profile row with the resolved categories', () => {
    const result = buildUserProfileView(
      {
        id: 'user-1',
        name: 'タロウ',
        bio: 'よろしくお願いします',
        role: 'mentor',
        avatar_url: 'https://example.test/avatar.png',
      },
      [{ key: 'career', label: 'キャリア相談' }]
    );

    expect(result).toEqual({
      id: 'user-1',
      name: 'タロウ',
      bio: 'よろしくお願いします',
      role: 'mentor',
      avatarUrl: 'https://example.test/avatar.png',
      categories: [{ key: 'career', label: 'キャリア相談' }],
    });
  });

  it('gives a student an empty category list', () => {
    const result = buildUserProfileView(
      { id: 'user-2', name: 'ハナコ', bio: '', role: 'student', avatar_url: null },
      []
    );

    expect(result.categories).toEqual([]);
  });

  it('carries through a null avatarUrl when the profile has none', () => {
    const result = buildUserProfileView(
      { id: 'user-3', name: 'ジロウ', bio: '', role: 'student', avatar_url: null },
      []
    );

    expect(result.avatarUrl).toBeNull();
  });
});
