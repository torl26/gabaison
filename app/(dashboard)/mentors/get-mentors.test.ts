import { describe, expect, it } from 'vitest';
import {
  buildMentorSummaries,
  excludeMentorsWithoutCategories,
  type MentorProfileRow,
  type MentorSummary,
} from './get-mentors';

function profileRow(overrides: Partial<MentorProfileRow> = {}): MentorProfileRow {
  return {
    id: 'mentor-1',
    name: 'タロウ',
    bio: '',
    role: 'mentor',
    avatar_url: null,
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

function mentorSummary(overrides: Partial<MentorSummary> = {}): MentorSummary {
  return {
    id: 'mentor-1',
    name: 'タロウ',
    bio: '',
    role: 'mentor',
    avatarUrl: null,
    categories: [],
    headline: '',
    affiliation: '',
    title: '',
    experienceYears: null,
    availability: '',
    accepting: true,
    skills: [],
    topics: [],
    links: [],
    almaMater: '',
    almaMaterDepartment: '',
    ...overrides,
  };
}

const profiles = [
  profileRow({
    id: 'mentor-1',
    name: 'タロウ',
    bio: 'キャリア相談が得意です',
    avatar_url: 'https://example.test/taro.png',
  }),
  profileRow({ id: 'mentor-2', name: 'ハナコ', bio: '技術メンタリングします' }),
];

const mentorCategories = [
  { mentor_id: 'mentor-1', category: { key: 'career' as const, label: 'キャリア相談' } },
  { mentor_id: 'mentor-1', category: { key: 'academic' as const, label: '学業/研究支援' } },
  { mentor_id: 'mentor-2', category: { key: 'skill' as const, label: 'スキル/技術メンタリング' } },
];

describe('buildMentorSummaries', () => {
  it('attaches each mentor their own categories', () => {
    const result = buildMentorSummaries(profiles, mentorCategories);

    expect(result).toMatchObject([
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

  it('carries the richer profile fields through to the summary', () => {
    const result = buildMentorSummaries(
      [
        profileRow({
          headline: '現役エンジニアが相談に乗ります',
          skills: ['React', 'Go'],
          topics: ['ES添削'],
          accepting: false,
          experience_years: 8,
          github_url: 'https://github.com/example',
        }),
      ],
      []
    );

    expect(result[0]).toMatchObject({
      headline: '現役エンジニアが相談に乗ります',
      skills: ['React', 'Go'],
      topics: ['ES添削'],
      accepting: false,
      experienceYears: 8,
      links: [{ label: 'GitHub', url: 'https://github.com/example' }],
    });
  });

  it('gives a mentor with no categories an empty list instead of dropping them', () => {
    const result = buildMentorSummaries([profileRow({ id: 'mentor-3', name: 'ジロウ' })], []);

    expect(result).toMatchObject([{ id: 'mentor-3', name: 'ジロウ', categories: [] }]);
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
      mentorSummary({
        id: 'mentor-1',
        categories: [{ key: 'career', label: 'キャリア相談' }],
      }),
      mentorSummary({ id: 'mentor-2', name: 'ハナコ', categories: [] }),
    ]);

    expect(result.map((m) => m.id)).toEqual(['mentor-1']);
  });

  it('keeps every mentor when all of them have at least one category', () => {
    const mentors = [
      mentorSummary({ categories: [{ key: 'career', label: 'キャリア相談' }] }),
    ];

    expect(excludeMentorsWithoutCategories(mentors)).toEqual(mentors);
  });
});
