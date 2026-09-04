import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260904110000_0021_badge_fk_indexes.sql'),
  'utf-8'
).toLowerCase();

describe('20260904110000_0021_badge_fk_indexes.sql', () => {
  it('indexes every unindexed FK column added by the badges migrations', () => {
    expect(sql).toContain(
      'create index if not exists badge_definitions_created_by_idx on public.badge_definitions (created_by)'
    );
    expect(sql).toContain(
      'create index if not exists user_badges_badge_definition_id_idx on public.user_badges (badge_definition_id)'
    );
    expect(sql).toContain(
      'create index if not exists user_badges_awarded_by_idx on public.user_badges (awarded_by)'
    );
  });
});
