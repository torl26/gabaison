import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260829070142_init.sql'),
  'utf-8'
).toLowerCase();

describe('20260829070142_init.sql', () => {
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

  it('blocks self-service role changes on profiles', () => {
    expect(sql).toContain('role cannot be changed after signup');
    expect(sql).toContain(
      "with check (auth.uid() = id and role in ('student', 'mentor'))"
    );
  });

  it('restricts match_request status changes to the mentor and locks foreign keys', () => {
    expect(sql).toContain('only the mentor can change the request status');
    expect(sql).toContain(
      'student_id, mentor_id, and category_id cannot be changed'
    );
  });
});
