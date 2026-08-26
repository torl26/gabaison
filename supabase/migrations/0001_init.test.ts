import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0001_init.sql'),
  'utf-8'
).toLowerCase();

describe('0001_init.sql', () => {
  it('creates all five tables', () => {
    for (const table of [
      'profiles',
      'categories',
      'mentor_categories',
      'match_requests',
      'messages',
    ]) {
      expect(sql).toContain(`create table public.${table}`);
    }
  });

  it('enables row level security on all five tables', () => {
    const matches = sql.match(/enable row level security/g) ?? [];
    expect(matches.length).toBe(5);
  });

  it('seeds the four fixed categories', () => {
    for (const key of ['career', 'skill', 'project', 'academic']) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it('restricts message inserts to accepted match_requests', () => {
    expect(sql).toContain("mr.status = 'accepted'");
  });
});
