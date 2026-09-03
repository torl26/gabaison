import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260904100000_0020_badge_images.sql'),
  'utf-8'
).toLowerCase();

describe('20260904100000_0020_badge_images.sql', () => {
  it('adds a nullable image_url column and drops the icon not-null constraint', () => {
    expect(sql).toContain('add column image_url text');
    expect(sql).toContain('alter column icon drop not null');
  });

  it('requires exactly one of icon (match_count) or image_url (manual)', () => {
    expect(sql).toContain('constraint badge_definitions_icon_or_image_by_source check');
    expect(sql).toContain("source = 'match_count' and icon is not null and image_url is null");
    expect(sql).toContain("source = 'manual' and icon is null and image_url is not null");
  });

  it('creates a public badge-icons bucket with the same file rules as avatars', () => {
    expect(sql).toContain("values ('badge-icons', 'badge-icons', true)");
    expect(sql).toContain("allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']");
    expect(sql).toContain('file_size_limit = 5242880');
  });

  it('restricts badge-icons writes to admins, with public read', () => {
    expect(sql).toContain('create policy "badge_icons_public_read" on storage.objects');
    expect(sql).toContain('create policy "badge_icons_insert_admin" on storage.objects');
    expect(sql).toContain('create policy "badge_icons_update_admin" on storage.objects');
    expect(sql).toContain('create policy "badge_icons_delete_admin" on storage.objects');
    expect(sql).toContain('(select public.is_admin())');
  });
});
