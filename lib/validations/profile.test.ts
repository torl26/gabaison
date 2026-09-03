import { describe, expect, it } from 'vitest';
import { profileSchema } from './profile';

describe('profileSchema', () => {
  it('accepts a valid profile with categories', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: 'よろしくお願いします。',
      categoryKeys: ['career', 'skill'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid profile without categories (student)', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = profileSchema.safeParse({ name: '', bio: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category key', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      categoryKeys: ['unknown'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an https avatarUrl', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a javascript: avatarUrl', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      avatarUrl: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
  });

  it('fills in the richer fields with empty defaults when they are omitted', () => {
    const result = profileSchema.safeParse({ name: '山田太郎', bio: '' });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      headline: '',
      affiliation: '',
      title: '',
      experienceYears: null,
      availability: '',
      accepting: true,
      skills: [],
      topics: [],
    });
  });

  it('accepts the richer profile fields', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      headline: '現役エンジニアが相談に乗ります',
      affiliation: '株式会社サンプル',
      title: 'バックエンドエンジニア',
      experienceYears: 8,
      availability: '平日夜',
      accepting: false,
      skills: ['React', 'Go'],
      topics: ['ES添削'],
      githubUrl: 'https://github.com/example',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a headline longer than 60 characters', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      headline: 'あ'.repeat(61),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative experienceYears', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      experienceYears: -1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-https link', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      githubUrl: 'http://github.com/example',
    });

    expect(result.success).toBe(false);
  });

  it('rejects more skill tags than the limit', () => {
    const result = profileSchema.safeParse({
      name: '山田太郎',
      bio: '',
      skills: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });

    expect(result.success).toBe(false);
  });
});
