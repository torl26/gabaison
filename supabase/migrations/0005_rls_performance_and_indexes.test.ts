import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0005_rls_performance_and_indexes.sql'),
  'utf-8'
).toLowerCase();

const REWRITTEN_POLICIES = [
  'profiles_insert_own',
  'profiles_update_own',
  'mentor_categories_insert_own',
  'mentor_categories_delete_own',
  'match_requests_select_participant',
  'match_requests_insert_student',
  'match_requests_update_participant',
  'messages_select_participant',
  'messages_insert_accepted_participant',
];

describe('0005_rls_performance_and_indexes.sql', () => {
  it('drops and recreates every auth.uid()-checking policy', () => {
    for (const policy of REWRITTEN_POLICIES) {
      expect(sql).toContain(`drop policy "${policy}"`);
      expect(sql).toContain(`create policy "${policy}"`);
    }
  });

  it('wraps every auth.uid() call in a select, per the Supabase linter', () => {
    const withoutComments = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    expect(withoutComments).not.toMatch(/(?<!\(select )auth\.uid\(\)/);
  });

  it('indexes every flagged foreign key column', () => {
    expect(sql).toContain('match_requests (category_id)');
    expect(sql).toContain('match_requests (mentor_id)');
    expect(sql).toContain('match_requests (student_id)');
    expect(sql).toContain('mentor_categories (category_id)');
    expect(sql).toContain('messages (match_id)');
    expect(sql).toContain('messages (sender_id)');
  });

  it('revokes public execute on the trigger-only functions', () => {
    expect(sql).toContain('revoke execute on function public.handle_new_user() from public, anon, authenticated');
    expect(sql).toContain('revoke execute on function public.prevent_profile_role_change() from public, anon, authenticated');
    expect(sql).toContain('revoke execute on function public.enforce_match_request_update() from public, anon, authenticated');
  });
});
