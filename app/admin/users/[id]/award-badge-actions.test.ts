import { afterEach, describe, expect, it, vi } from 'vitest';

const { requireAdminMock, fromMock, insertMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { awardBadgeAction } from './award-badge-actions';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BADGE_DEFINITION_ID = '22222222-2222-4222-8222-222222222222';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('awardBadgeAction', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
  });

  it('rejects a non-uuid badgeDefinitionId before touching Supabase', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });

    const result = await awardBadgeAction(
      null,
      formDataFor({ userId: USER_ID, badgeDefinitionId: 'not-a-uuid' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a user_badges row with the admin as awarded_by', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await awardBadgeAction(
      null,
      formDataFor({ userId: USER_ID, badgeDefinitionId: BADGE_DEFINITION_ID })
    );

    expect(fromMock).toHaveBeenCalledWith('user_badges');
    expect(insertMock).toHaveBeenCalledWith({
      user_id: USER_ID,
      badge_definition_id: BADGE_DEFINITION_ID,
      awarded_by: 'admin-1',
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('turns a duplicate-award unique violation into a friendly message', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await awardBadgeAction(
      null,
      formDataFor({ userId: USER_ID, badgeDefinitionId: BADGE_DEFINITION_ID })
    );

    expect(result).toEqual({ success: false, error: 'すでに付与済みです' });
  });

  it('returns a generic error for any other insert failure', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '23503', message: 'boom' } });

    const result = await awardBadgeAction(
      null,
      formDataFor({ userId: USER_ID, badgeDefinitionId: BADGE_DEFINITION_ID })
    );

    expect(result.success).toBe(false);
  });
});
