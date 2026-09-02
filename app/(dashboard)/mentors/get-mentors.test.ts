import { describe, expect, it } from 'vitest';
import { buildMentorSummaries, excludeMentorsWithoutCategories } from './get-mentors';

const profiles = [
  {
    id: 'mentor-1',
    name: 'タロウ',
    bio: 'キャリア相談が得意です',
    avatar_url: 'https://example.test/taro.png',
  },
  { id: 'mentor-2', name: 'ハナコ', bio: '技術メンタリングします', avatar_url: null },
];

const mentorCategories = [
  { mentor_id: 'mentor-1', category: { key: 'career' as const, label: 'キャリア相談' } },
  { mentor_id: 'mentor-1', category: { key: 'academic' as const, label: '学業/研究支援' } },
  { mentor_id: 'mentor-2', category: { key: 'skill' as const, label: 'スキル/技術メンタリング' } },
];

describe('buildMentorSummaries', () => {
  it('attaches each mentor their own categories', () => {
    const result = buildMentorSummaries(profiles, mentorCategories);

    expect(result).toEqual([
      {
        id: 'mentor-1',
        name: 'タロウ',
        bio: 'キャリア相談が得意です',
        avatarUrl: 'https://example.test/taro.png',
        categories: [
          { key: 'career', label: 'キャリア相談' },
          { key: 'academic', label: '学業/研究支援' },
        ],
      },
      {
        id: 'mentor-2',
        name: 'ハナコ',
        bio: '技術メンタリングします',
        avatarUrl: null,
        categories: [{ key: 'skill', label: 'スキル/技術メンタリング' }],
      },
    ]);
  });

  it('gives a mentor with no categories an empty list instead of dropping them', () => {
    const result = buildMentorSummaries(
      [{ id: 'mentor-3', name: 'ジロウ', bio: '', avatar_url: null }],
      []
    );

    expect(result).toEqual([
      { id: 'mentor-3', name: 'ジロウ', bio: '', avatarUrl: null, categories: [] },
    ]);
  });

  it('filters out mentors who do not have the requested category', () => {
    const result = buildMentorSummaries(profiles, mentorCategories, 'skill');

    expect(result.map((m) => m.id)).toEqual(['mentor-2']);
  });

  it('returns every mentor when no category filter is given', () => {
    const result = buildMentorSummaries(profiles, mentorCategories);

    expect(result.map((m) => m.id)).toEqual(['mentor-1', 'mentor-2']);
  });
});

describe('excludeMentorsWithoutCategories', () => {
  it('drops a mentor who has not selected any category', () => {
    const result = excludeMentorsWithoutCategories([
      {
        id: 'mentor-1',
        name: 'タロウ',
        bio: '',
        avatarUrl: null,
        categories: [{ key: 'career', label: 'キャリア相談' }],
      },
      { id: 'mentor-2', name: 'ハナコ', bio: '', avatarUrl: null, categories: [] },
    ]);

    expect(result.map((m) => m.id)).toEqual(['mentor-1']);
  });

  it('keeps every mentor when all of them have at least one category', () => {
    const mentors = [
      {
        id: 'mentor-1',
        name: 'タロウ',
        bio: '',
        avatarUrl: null,
        categories: [{ key: 'career' as const, label: 'キャリア相談' }],
      },
    ];

    expect(excludeMentorsWithoutCategories(mentors)).toEqual(mentors);
  });
});
