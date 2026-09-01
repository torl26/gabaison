import { describe, expect, it } from 'vitest';
import { validateAvatarFile, buildAvatarStoragePath } from './avatar-upload';

describe('validateAvatarFile', () => {
  it('accepts a small png file', () => {
    const error = validateAvatarFile({ type: 'image/png', size: 1024 });
    expect(error).toBeNull();
  });

  it('accepts jpeg, webp, and gif', () => {
    expect(validateAvatarFile({ type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/webp', size: 1024 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/gif', size: 1024 })).toBeNull();
  });

  it('rejects svg, since it can embed executable script (stored XSS)', () => {
    const error = validateAvatarFile({ type: 'image/svg+xml', size: 1024 });
    expect(error).toBe('画像ファイル(PNG/JPEG/WebP/GIF)を選択してください');
  });

  it('rejects a non-image file', () => {
    const error = validateAvatarFile({ type: 'application/pdf', size: 1024 });
    expect(error).toBe('画像ファイル(PNG/JPEG/WebP/GIF)を選択してください');
  });

  it('rejects a file larger than 5MB', () => {
    const error = validateAvatarFile({ type: 'image/png', size: 6 * 1024 * 1024 });
    expect(error).toBe('画像サイズは5MB以内にしてください');
  });

  it('accepts a file exactly at the 5MB limit', () => {
    const error = validateAvatarFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 });
    expect(error).toBeNull();
  });
});

describe('buildAvatarStoragePath', () => {
  it('derives the extension from the validated mime type, not the file name', () => {
    expect(buildAvatarStoragePath('user-1', 'image/png')).toBe('user-1/avatar.png');
    expect(buildAvatarStoragePath('user-1', 'image/jpeg')).toBe('user-1/avatar.jpg');
    expect(buildAvatarStoragePath('user-1', 'image/webp')).toBe('user-1/avatar.webp');
    expect(buildAvatarStoragePath('user-1', 'image/gif')).toBe('user-1/avatar.gif');
  });

  it('falls back to jpg for an unrecognized mime type', () => {
    expect(buildAvatarStoragePath('user-1', 'image/svg+xml')).toBe('user-1/avatar.jpg');
  });
});
