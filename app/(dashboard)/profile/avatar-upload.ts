const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

// image/svg+xml is deliberately excluded: SVGs can embed <script> and would
// be served back verbatim from the public bucket (stored XSS).
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!(file.type in ALLOWED_AVATAR_TYPES)) {
    return '画像ファイル(PNG/JPEG/WebP/GIF)を選択してください';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return '画像サイズは5MB以内にしてください';
  }
  return null;
}

// Takes the file's mime type, not its user-supplied file name, so nothing
// attacker-controlled ends up in the storage object key.
export function buildAvatarStoragePath(userId: string, mimeType: string): string {
  const extension = ALLOWED_AVATAR_TYPES[mimeType] ?? 'jpg';
  return `${userId}/avatar.${extension}`;
}
