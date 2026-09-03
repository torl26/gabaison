import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260902061719_0009_wrap_is_admin_select.sql'),
  'utf-8'
).toLowerCase();

const REWRITTEN_POLICIES = ['match_requests_select_participant', 'messages_select_participant'];

const withoutComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

describe('20260902061719_0009_wrap_is_admin_select.sql', () => {
  it('drops and recreates both is_admin()-checking policies', () => {
    for (const policy of REWRITTEN_POLICIES) {
      expect(sql).toContain(`drop policy "${policy}"`);
      expect(sql).toContain(`create policy "${policy}"`);
    }
  });

  it('wraps every public.is_admin() call in a select, excluding comment lines', () => {
    expect(withoutComments).not.toMatch(/(?<!\(select )public\.is_admin\(\)/);
    expect(withoutComments).toContain('(select public.is_admin())');
  });

  it('checks is_admin() before the participant EXISTS clause in the messages policy', () => {
    const messagesPolicyStart = withoutComments.indexOf(
      'create policy "messages_select_participant"'
    );
    expect(messagesPolicyStart).toBeGreaterThan(-1);

    const messagesPolicyBody = withoutComments.slice(messagesPolicyStart);
    const isAdminIndex = messagesPolicyBody.indexOf('(select public.is_admin())');
    const existsIndex = messagesPolicyBody.indexOf('exists (');

    expect(isAdminIndex).toBeGreaterThan(-1);
    expect(existsIndex).toBeGreaterThan(-1);
    expect(isAdminIndex).toBeLessThan(existsIndex);
  });
});
