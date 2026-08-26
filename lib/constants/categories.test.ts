import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_KEYS } from './categories';

describe('categories', () => {
  it('has exactly the four fixed category keys, in order', () => {
    expect(CATEGORY_KEYS).toEqual(['career', 'skill', 'project', 'academic']);
  });

  it('has a non-empty label for every category, in the same order as the keys', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual(CATEGORY_KEYS);
    for (const category of CATEGORIES) {
      expect(category.label.length).toBeGreaterThan(0);
    }
  });
});
