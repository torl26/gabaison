import { describe, expect, it } from 'vitest';
import { buildProfileLinks, buildUserProfileView, type UserProfileRow } from './get-user-profile';

function profileRow(overrides: Partial<UserProfileRow> = {}): UserProfileRow {
  return {
    id: 'user-1',
    name: 'タロウ',
    bio: 'よろしくお願いします',
    role: 'mentor',
    avatar_url: 'https://example.test/avatar.png',
    headline: '',
    affiliation: '',
    title: '',
    experience_years: null,
    availability: '',
    accepting: true,
    skills: [],
    topics: [],
    github_url: null,
    x_url: null,
    website_url: null,
    alma_mater: '',
    alma_mater_department: '',
    ...overrides,
  };
}

describe('buildUserProfileView', () => {
  it('combines the profile row with the resolved categories', () => {
    const result = buildUserProfileView(profileRow(), [
      { key: 'career', label: 'キャリア相談' },
    ]);

    expect(result).toMatchObject({
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
      profileRow({ id: 'user-2', name: 'ハナコ', bio: '', role: 'student', avatar_url: null }),
      []
    );

    expect(result.categories).toEqual([]);
  });

  it('carries through a null avatarUrl when the profile has none', () => {
    const result = buildUserProfileView(profileRow({ avatar_url: null }), []);

    expect(result.avatarUrl).toBeNull();
  });

  it('exposes the richer profile fields', () => {
    const result = buildUserProfileView(
      profileRow({
        headline: '現役エンジニアがキャリア相談に乗ります',
        affiliation: '株式会社サンプル',
        title: 'バックエンドエンジニア',
        experience_years: 8,
        availability: '平日夜・週末',
        accepting: false,
        skills: ['React', 'Go'],
        topics: ['ES添削', '技術選定の相談'],
      }),
      []
    );

    expect(result).toMatchObject({
      headline: '現役エンジニアがキャリア相談に乗ります',
      affiliation: '株式会社サンプル',
      title: 'バックエンドエンジニア',
      experienceYears: 8,
      availability: '平日夜・週末',
      accepting: false,
      skills: ['React', 'Go'],
      topics: ['ES添削', '技術選定の相談'],
    });
  });

  it('exposes the alma mater fields', () => {
    const result = buildUserProfileView(
      profileRow({ alma_mater: 'サンプル大学', alma_mater_department: '工学部情報工学科' }),
      []
    );

    expect(result).toMatchObject({
      almaMater: 'サンプル大学',
      almaMaterDepartment: '工学部情報工学科',
    });
  });

  it('tolerates arrays arriving as null from the database', () => {
    const result = buildUserProfileView(
      profileRow({
        skills: null as unknown as string[],
        topics: null as unknown as string[],
      }),
      []
    );

    expect(result.skills).toEqual([]);
    expect(result.topics).toEqual([]);
  });
});

describe('buildProfileLinks', () => {
  it('keeps only the links that are set, in a fixed order', () => {
    expect(
      buildProfileLinks({
        github_url: 'https://github.com/example',
        x_url: null,
        website_url: 'https://example.test',
      })
    ).toEqual([
      { label: 'GitHub', url: 'https://github.com/example' },
      { label: 'Webサイト', url: 'https://example.test' },
    ]);
  });

  it('returns an empty array when no link is set', () => {
    expect(buildProfileLinks({ github_url: null, x_url: null, website_url: null })).toEqual([]);
  });
});
