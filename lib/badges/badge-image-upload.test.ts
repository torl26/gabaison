import { describe, expect, it } from 'vitest';
import { validateBadgeImageFile, buildBadgeImageStoragePath } from './badge-image-upload';

describe('validateBadgeImageFile', () => {
  it('accepts a small png file', () => {
    const error = validateBadgeImageFile({ type: 'image/png', size: 1024 });
    expect(error).toBeNull();
  });

  it('accepts jpeg, webp, and gif', () => {
    expect(validateBadgeImageFile({ type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(validateBadgeImageFile({ type: 'image/webp', size: 1024 })).toBeNull();
    expect(validateBadgeImageFile({ type: 'image/gif', size: 1024 })).toBeNull();
  });

  it('rejects svg, since it can embed executable script (stored XSS)', () => {
    const error = validateBadgeImageFile({ type: 'image/svg+xml', size: 1024 });
    expect(error).toBe('画像ファイル(PNG/JPEG/WebP/GIF)を選択してください');
  });

  it('rejects a non-image file', () => {
    const error = validateBadgeImageFile({ type: 'application/pdf', size: 1024 });
    expect(error).toBe('画像ファイル(PNG/JPEG/WebP/GIF)を選択してください');
  });

  it('rejects a file larger than 5MB', () => {
    const error = validateBadgeImageFile({ type: 'image/png', size: 6 * 1024 * 1024 });
    expect(error).toBe('画像サイズは5MB以内にしてください');
  });

  it('accepts a file exactly at the 5MB limit', () => {
    const error = validateBadgeImageFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 });
    expect(error).toBeNull();
  });
});

describe('buildBadgeImageStoragePath', () => {
  it('derives the extension from the validated mime type, not the file name', () => {
    expect(buildBadgeImageStoragePath('image/png')).toMatch(/^[^/]+\.png$/);
    expect(buildBadgeImageStoragePath('image/jpeg')).toMatch(/^[^/]+\.jpg$/);
    expect(buildBadgeImageStoragePath('image/webp')).toMatch(/^[^/]+\.webp$/);
    expect(buildBadgeImageStoragePath('image/gif')).toMatch(/^[^/]+\.gif$/);
  });

  it('falls back to jpg for an unrecognized mime type', () => {
    expect(buildBadgeImageStoragePath('image/svg+xml')).toMatch(/^[^/]+\.jpg$/);
  });

  it('generates a different path on every call, so re-uploads never collide', () => {
    expect(buildBadgeImageStoragePath('image/png')).not.toBe(buildBadgeImageStoragePath('image/png'));
  });
});
