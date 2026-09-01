const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('image/')) {
    return '画像ファイルを選択してください';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return '画像サイズは5MB以内にしてください';
  }
  return null;
}

export function buildAvatarStoragePath(userId: string, fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const extension = dotIndex === -1 ? 'jpg' : fileName.slice(dotIndex + 1).toLowerCase();
  return `${userId}/avatar.${extension}`;
}
