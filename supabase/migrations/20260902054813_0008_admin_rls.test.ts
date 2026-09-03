import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260902054813_0008_admin_rls.sql'),
  'utf-8'
).toLowerCase();

describe('20260902054813_0008_admin_rls.sql', () => {
  it('creates an is_admin() security definer function scoped to the caller', () => {
    expect(sql).toContain('create or replace function public.is_admin()');
    expect(sql).toContain('security definer');
    expect(sql).toContain("where id = auth.uid() and role = 'admin'");
  });

  it('lets admins read every match_requests row alongside participants', () => {
    expect(sql).toContain('drop policy "match_requests_select_participant"');
    expect(sql).toContain('create policy "match_requests_select_participant"');
    const matchRequestsPolicyIndex = sql.indexOf(
      'create policy "match_requests_select_participant"'
    );
    const matchRequestsPolicySnippet = sql.slice(
      matchRequestsPolicyIndex,
      matchRequestsPolicyIndex + 400
    );
    expect(matchRequestsPolicySnippet).toContain('or public.is_admin()');
  });

  it('lets admins read every messages row alongside participants', () => {
    expect(sql).toContain('drop policy "messages_select_participant"');
    expect(sql).toContain('create policy "messages_select_participant"');
    const messagesPolicyIndex = sql.indexOf(
      'create policy "messages_select_participant"'
    );
    const messagesPolicySnippet = sql.slice(messagesPolicyIndex);
    expect(messagesPolicySnippet).toContain('or public.is_admin()');
  });
});
