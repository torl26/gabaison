import { describe, expect, it } from 'vitest';
import { validateAvatarFile, buildAvatarStoragePath } from './avatar-upload';

describe('validateAvatarFile', () => {
  it('accepts a small image file', () => {
    const error = validateAvatarFile({ type: 'image/png', size: 1024 });
    expect(error).toBeNull();
  });

  it('rejects a non-image file', () => {
    const error = validateAvatarFile({ type: 'application/pdf', size: 1024 });
    expect(error).toBe('画像ファイルを選択してください');
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
  it('builds a path scoped to the user id, keeping the extension', () => {
    const path = buildAvatarStoragePath('user-1', 'photo.png');
    expect(path).toBe('user-1/avatar.png');
  });

  it('lowercases the extension', () => {
    const path = buildAvatarStoragePath('user-1', 'photo.JPG');
    expect(path).toBe('user-1/avatar.jpg');
  });

  it('falls back to jpg when the file name has no extension', () => {
    const path = buildAvatarStoragePath('user-1', 'photo');
    expect(path).toBe('user-1/avatar.jpg');
  });
});
