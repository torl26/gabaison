import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260904090000_0018_badges.sql'),
  'utf-8'
).toLowerCase();

describe('20260904090000_0018_badges.sql', () => {
  it('creates badge_definitions with a source check and a threshold-only-for-match_count constraint', () => {
    expect(sql).toContain('create table public.badge_definitions');
    expect(sql).toContain("source in ('manual', 'match_count')");
    expect(sql).toContain('constraint badge_definitions_threshold_only_for_match_count check');
  });

  it('enables RLS on badge_definitions with authenticated select and admin-only manual insert', () => {
    expect(sql).toContain('alter table public.badge_definitions enable row level security');
    expect(sql).toContain('create policy "badge_definitions_select_authenticated" on public.badge_definitions');
    expect(sql).toContain('create policy "badge_definitions_insert_admin" on public.badge_definitions');
    expect(sql).toContain('(select public.is_admin())');
    expect(sql).toContain("and source = 'manual'");
  });

  it('seeds the three match_count badge definitions', () => {
    expect(sql).toContain("'match_count_1', '初マッチング達成', '🎯', 'match_count', 1");
    expect(sql).toContain("'match_count_5', 'マッチング5件達成', '🔥', 'match_count', 5");
    expect(sql).toContain("'match_count_10', 'マッチング10件達成', '🏆', 'match_count', 10");
  });

  it('creates user_badges with a unique (user_id, badge_definition_id) pair', () => {
    expect(sql).toContain('create table public.user_badges');
    expect(sql).toContain('unique (user_id, badge_definition_id)');
  });

  it('enables RLS on user_badges with authenticated select and admin-only manual-badge insert', () => {
    expect(sql).toContain('alter table public.user_badges enable row level security');
    expect(sql).toContain('create policy "user_badges_select_authenticated" on public.user_badges');
    expect(sql).toContain('create policy "user_badges_insert_admin" on public.user_badges');
    expect(sql).toContain('awarded_by = (select auth.uid())');
    expect(sql).toContain("where source = 'manual'");
  });

  it('has no update or delete policy on either table', () => {
    expect(sql).not.toContain('for update');
    expect(sql).not.toContain('for delete');
  });

  it('defines award_match_count_badges as a security definer function', () => {
    expect(sql).toContain('create or replace function public.award_match_count_badges(p_user_id uuid)');
    expect(sql).toContain('security definer');
    expect(sql).toContain("bd.source = 'match_count' and bd.threshold <= v_count");
    expect(sql).toContain('on conflict (user_id, badge_definition_id) do nothing');
  });

  it('counts accepted and completed matches cumulatively, not just currently-accepted ones', () => {
    expect(sql).toContain("where status in ('accepted', 'completed')");
  });

  it('triggers the auto-award only on the transition into accepted', () => {
    expect(sql).toContain('create trigger match_requests_award_badges');
    expect(sql).toContain('after update of status on public.match_requests');
    expect(sql).toContain("when (new.status = 'accepted' and old.status is distinct from 'accepted')");
  });

  it('revokes public/anon/authenticated execute on the two new security definer functions', () => {
    expect(sql).toContain('revoke execute on function public.award_match_count_badges(uuid) from public, anon, authenticated');
    expect(sql).toContain('revoke execute on function public.award_match_count_badges_on_accept() from public, anon, authenticated');
  });

  it('backfills badges for profiles that already qualify as of this migration', () => {
    expect(sql).toContain('select public.award_match_count_badges(id) from public.profiles');
  });
});
