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
});
