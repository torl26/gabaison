import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0014_reports.sql'),
  'utf-8'
).toLowerCase();

describe('0014_reports.sql', () => {
  it('creates the reports table with a fixed reason enum and a self-report check', () => {
    expect(sql).toContain('create table public.reports');
    expect(sql).toContain(
      "reason in ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')"
    );
    expect(sql).toContain('constraint reports_not_self check (reporter_id <> reported_id)');
  });

  it('enables RLS with insert-own and admin-only select', () => {
    expect(sql).toContain('alter table public.reports enable row level security');
    expect(sql).toContain('with check (reporter_id = (select auth.uid()))');
    expect(sql).toContain('using ((select public.is_admin()))');
  });

  it('has no update or delete policy', () => {
    expect(sql).not.toContain('for update');
    expect(sql).not.toContain('for delete');
  });
});
