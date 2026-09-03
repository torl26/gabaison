import { describe, expect, it } from 'vitest';
import { buildUserBadges, type UserBadgeRow } from './get-user-badges';

function badgeRow(overrides: Partial<UserBadgeRow> = {}): UserBadgeRow {
  return {
    id: 'user-badge-1',
    awarded_at: '2026-09-04T00:00:00.000Z',
    badge_definition_id: 'badge-def-1',
    badge: { label: '初マッチング達成', icon: '🎯', image_url: null },
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
        imageUrl: null,
        awardedAt: '2026-09-04T00:00:00.000Z',
      },
    ]);
  });

  it('maps a manual badge with an image and no icon', () => {
    const result = buildUserBadges([
      badgeRow({
        badge: { label: 'ハッカソン参加', icon: null, image_url: 'https://example.com/badge.png' },
      }),
    ]);

    expect(result[0]).toMatchObject({
      icon: null,
      imageUrl: 'https://example.com/badge.png',
    });
  });

  it('drops a row whose joined badge definition is missing', () => {
    const result = buildUserBadges([badgeRow({ badge: null })]);

    expect(result).toEqual([]);
  });
});
