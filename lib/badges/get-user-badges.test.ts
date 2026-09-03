import { describe, expect, it } from 'vitest';
import { buildUserBadges, type UserBadgeRow } from './get-user-badges';

function badgeRow(overrides: Partial<UserBadgeRow> = {}): UserBadgeRow {
  return {
    id: 'user-badge-1',
    awarded_at: '2026-09-04T00:00:00.000Z',
    badge_definition_id: 'badge-def-1',
    badge: { label: '初マッチング達成', icon: '🎯' },
    ...overrides,
  };
}

describe('buildUserBadges', () => {
  it('maps a joined row into a flat view', () => {
    const result = buildUserBadges([badgeRow()]);

    expect(result).toEqual([
      {
        id: 'user-badge-1',
        badgeDefinitionId: 'badge-def-1',
        label: '初マッチング達成',
        icon: '🎯',
        awardedAt: '2026-09-04T00:00:00.000Z',
      },
    ]);
  });

  it('drops a row whose joined badge definition is missing', () => {
    const result = buildUserBadges([badgeRow({ badge: null })]);

    expect(result).toEqual([]);
  });
});
