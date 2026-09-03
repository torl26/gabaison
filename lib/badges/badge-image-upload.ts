const MAX_BADGE_IMAGE_BYTES = 5 * 1024 * 1024;

// image/svg+xml is deliberately excluded: SVGs can embed <script> and would
// be served back verbatim from the public bucket (stored XSS).
const ALLOWED_BADGE_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function validateBadgeImageFile(file: { type: string; size: number }): string | null {
  if (!(file.type in ALLOWED_BADGE_IMAGE_TYPES)) {
    return '画像ファイル(PNG/JPEG/WebP/GIF)を選択してください';
  }
  if (file.size > MAX_BADGE_IMAGE_BYTES) {
    return '画像サイズは5MB以内にしてください';
  }
  return null;
}

// Badges have no natural owner at upload time (the badge_definitions row
// doesn't exist yet), unlike avatars which are keyed by user id — so the
// object name is just a random id, derived from the file's mime type
// rather than its user-supplied name.
export function buildBadgeImageStoragePath(mimeType: string): string {
  const extension = ALLOWED_BADGE_IMAGE_TYPES[mimeType] ?? 'jpg';
  return `${crypto.randomUUID()}.${extension}`;
}
