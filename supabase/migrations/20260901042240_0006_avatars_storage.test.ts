import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260901042240_0006_avatars_storage.sql'),
  'utf-8'
).toLowerCase();

describe('20260901042240_0006_avatars_storage.sql', () => {
  it('creates a public avatars bucket', () => {
    expect(sql).toContain("insert into storage.buckets (id, name, public)");
    expect(sql).toContain("values ('avatars', 'avatars', true)");
  });

  it('lets anyone read avatars', () => {
    expect(sql).toContain('create policy "avatars_public_read" on storage.objects');
    expect(sql).toMatch(/for select[\s\S]*using \(\s*bucket_id = 'avatars'\s*\)/);
  });

  it('restricts insert, update, and delete to the uploader\'s own folder', () => {
    for (const action of ['insert', 'update', 'delete']) {
      expect(sql).toContain(`for ${action} to authenticated`);
    }
    expect(sql).toContain("(storage.foldername(name))[1] = (select auth.uid())::text");
  });
});
