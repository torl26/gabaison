import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0007_avatars_bucket_restrictions.sql'),
  'utf-8'
).toLowerCase();

describe('0007_avatars_bucket_restrictions.sql', () => {
  it('restricts the avatars bucket to raster image types, excluding svg', () => {
    expect(sql).toContain('allowed_mime_types');
    expect(sql).toContain("'image/png'");
    expect(sql).toContain("'image/jpeg'");
    expect(sql).toContain("'image/webp'");
    expect(sql).toContain("'image/gif'");

    const withoutComments = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    expect(withoutComments).not.toContain('svg');
  });

  it('caps the avatars bucket file size at 5MB', () => {
    expect(sql).toContain('file_size_limit');
    expect(sql).toContain('5242880');
  });

  it('targets the avatars bucket', () => {
    expect(sql).toMatch(/where\s+id\s*=\s*'avatars'/);
  });
});
