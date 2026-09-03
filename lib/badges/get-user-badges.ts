import type { createClient } from '@/lib/supabase/server';

export interface UserBadgeRow {
  id: string;
  awarded_at: string;
  badge_definition_id: string;
  badge: { label: string; icon: string } | null;
}

export interface UserBadgeView {
  id: string;
  badgeDefinitionId: string;
  label: string;
  icon: string;
  awardedAt: string;
}

export function buildUserBadges(rows: UserBadgeRow[]): UserBadgeView[] {
  return rows
    .filter(
      (row): row is UserBadgeRow & { badge: { label: string; icon: string } } =>
        row.badge !== null
    )
    .map((row) => ({
      id: row.id,
      badgeDefinitionId: row.badge_definition_id,
      label: row.badge.label,
      icon: row.badge.icon,
      awardedAt: row.awarded_at,
    }));
}

export async function fetchUserBadges(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserBadgeView[]> {
  const { data } = await supabase
    .from('user_badges')
    .select('id, awarded_at, badge_definition_id, badge:badge_definitions(label, icon)')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: true });

  return buildUserBadges((data ?? []) as unknown as UserBadgeRow[]);
}
