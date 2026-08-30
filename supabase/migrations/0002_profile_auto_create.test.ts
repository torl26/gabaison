import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0002_profile_auto_create.sql'),
  'utf-8'
).toLowerCase();

describe('0002_profile_auto_create.sql', () => {
  it('creates a trigger on auth.users that runs handle_new_user', () => {
    expect(sql).toContain('after insert on auth.users');
    expect(sql).toContain('execute function public.handle_new_user()');
  });

  it('inserts into profiles as security definer, bypassing rls', () => {
    expect(sql).toContain('security definer');
    expect(sql).toContain('insert into public.profiles');
  });

  it('only trusts role from signup metadata when it is student or mentor', () => {
    expect(sql).toContain("in ('student', 'mentor')");
    expect(sql).not.toMatch(/values\s*\(\s*new\.id,\s*new\.raw_user_meta_data->>'role'/);
  });
});
