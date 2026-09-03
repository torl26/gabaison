import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260903100200_0015_blocks.sql'),
  'utf-8'
).toLowerCase();

describe('20260903100200_0015_blocks.sql', () => {
  it('creates the blocks table with a self-block check', () => {
    expect(sql).toContain('create table public.blocks');
    expect(sql).toContain('constraint blocks_not_self check (blocker_id <> blocked_id)');
  });

  it('enables RLS on blocks scoped to the blocker', () => {
    expect(sql).toContain('alter table public.blocks enable row level security');
    expect(sql).toContain('using (blocker_id = (select auth.uid()))');
    expect(sql).toContain('with check (blocker_id = (select auth.uid()))');
  });

  it('defines is_blocked as a bidirectional, security definer check', () => {
    expect(sql).toContain('create or replace function public.is_blocked(a uuid, b uuid)');
    expect(sql).toContain('security definer');
    expect(sql).toContain(
      'where (blocker_id = a and blocked_id = b)\n       or (blocker_id = b and blocked_id = a)'
    );
  });

  it('defines get_blocked_profiles scoped to the calling user', () => {
    expect(sql).toContain('create or replace function public.get_blocked_profiles()');
    expect(sql).toContain('where b.blocker_id = (select auth.uid())');
  });

  it('hides a blocked counterpart from profiles select, unless admin or self', () => {
    expect(sql).toContain('drop policy "profiles_select_authenticated" on public.profiles');
    expect(sql).toContain('or public.is_admin()');
    expect(sql).toContain('or not public.is_blocked(id, (select auth.uid()))');
  });

  it('blocks new match requests between blocked pairs', () => {
    expect(sql).toContain('drop policy "match_requests_insert_student" on public.match_requests');
    expect(sql).toContain('and not public.is_blocked(student_id, mentor_id)');
  });

  it('allows a block-triggered forced cancellation regardless of caller role', () => {
    expect(sql).toContain(
      "if new.status = 'cancelled' and public.is_blocked(old.student_id, old.mentor_id) then"
    );
  });

  it('cancels pending or accepted matches on block insert via a trigger', () => {
    expect(sql).toContain('create or replace function public.cancel_matches_on_block()');
    expect(sql).toContain("where status in ('pending', 'accepted')");
    expect(sql).toContain('create trigger on_block_cancel_matches');
    expect(sql).toContain('after insert on public.blocks');
  });
});
