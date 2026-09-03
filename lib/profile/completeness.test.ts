import { describe, expect, it } from 'vitest';
import { calculateCompleteness } from './completeness';
import type { UserProfileView } from './get-user-profile';

function profileView(overrides: Partial<UserProfileView> = {}): UserProfileView {
  return {
    id: 'user-1',
    name: 'タロウ',
    bio: '',
    role: 'student',
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
    ...overrides,
  };
}

describe('calculateCompleteness', () => {
  it('is 0% for an untouched profile', () => {
    const result = calculateCompleteness(profileView());

    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(result.items.length);
  });

  it('is 100% once every tracked field is filled in', () => {
    const result = calculateCompleteness(
      profileView({
        avatarUrl: 'https://example.test/a.png',
        headline: 'ひとこと',
        bio: '自己紹介',
        affiliation: 'サンプル大学',
        title: '情報工学科 2年',
        skills: ['React'],
        topics: ['ES添削'],
        availability: '平日夜',
        links: [{ label: 'GitHub', url: 'https://github.com/example' }],
      })
    );

    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it('counts mentor-only fields for mentors', () => {
    const student = calculateCompleteness(profileView({ role: 'student' }));
    const mentor = calculateCompleteness(profileView({ role: 'mentor' }));

    expect(mentor.items.length).toBe(student.items.length + 2);
    expect(mentor.items.map((item) => item.key)).toContain('categories');
    expect(mentor.items.map((item) => item.key)).toContain('experienceYears');
  });

  it('labels the affiliation field differently per role', () => {
    const student = calculateCompleteness(profileView({ role: 'student' }));
    const mentor = calculateCompleteness(profileView({ role: 'mentor' }));

    expect(student.items.find((item) => item.key === 'affiliation')?.label).toBe('学校名');
    expect(mentor.items.find((item) => item.key === 'affiliation')?.label).toBe('会社・組織');
  });

  it('treats whitespace-only text as unfilled', () => {
    const result = calculateCompleteness(profileView({ headline: '   ', bio: '\n' }));

    expect(result.missing.map((item) => item.key)).toContain('headline');
    expect(result.missing.map((item) => item.key)).toContain('bio');
  });

  it('rounds the percentage to a whole number', () => {
    const result = calculateCompleteness(profileView({ role: 'student', headline: 'あり' }));

    expect(Number.isInteger(result.percent)).toBe(true);
    expect(result.percent).toBe(Math.round((1 / 9) * 100));
  });
});
