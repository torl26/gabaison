import { describe, expect, it } from 'vitest';
import { buildMentorSummaries } from './get-mentors';

const profiles = [
  { id: 'mentor-1', name: 'タロウ', bio: 'キャリア相談が得意です' },
  { id: 'mentor-2', name: 'ハナコ', bio: '技術メンタリングします' },
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
        categories: [
          { key: 'career', label: 'キャリア相談' },
          { key: 'academic', label: '学業/研究支援' },
        ],
      },
      {
        id: 'mentor-2',
        name: 'ハナコ',
        bio: '技術メンタリングします',
        categories: [{ key: 'skill', label: 'スキル/技術メンタリング' }],
      },
    ]);
  });

  it('gives a mentor with no categories an empty list instead of dropping them', () => {
    const result = buildMentorSummaries(
      [{ id: 'mentor-3', name: 'ジロウ', bio: '' }],
      []
    );

    expect(result).toEqual([
      { id: 'mentor-3', name: 'ジロウ', bio: '', categories: [] },
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
