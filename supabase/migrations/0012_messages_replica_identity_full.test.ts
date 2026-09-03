import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0012_messages_replica_identity_full.sql'),
  'utf-8'
).toLowerCase();

describe('0012_messages_replica_identity_full.sql', () => {
  it('sets replica identity full on messages so realtime UPDATE payloads are complete', () => {
    expect(sql).toContain('alter table public.messages replica identity full');
  });
});
