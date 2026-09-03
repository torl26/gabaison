import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, insertMock, deleteMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { blockUserAction, unblockUserAction } from './block-actions';

const BLOCKED_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('blockUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
    deleteMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a blocks row with the current user as blocker', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(fromMock).toHaveBeenCalledWith('blocks');
    expect(insertMock).toHaveBeenCalledWith({
      blocker_id: 'user-1',
      blocked_id: BLOCKED_ID,
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns a friendly message on a duplicate block', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result).toEqual({ success: false, error: 'すでにブロック済みです' });
  });

  it('returns an error on other insert failures', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { code: '500', message: 'boom' } });

    const result = await blockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(result.success).toBe(false);
  });
});

describe('unblockUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    deleteMock.mockReset();
  });

  it('deletes the blocks row scoped to the current user as blocker', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    const eqBlockerMock = vi.fn();
    const eqBlockedMock = vi.fn().mockResolvedValue({ error: null });
    eqBlockerMock.mockReturnValue({ eq: eqBlockedMock });
    deleteMock.mockReturnValue({ eq: eqBlockerMock });
    fromMock.mockReturnValue({ delete: deleteMock });

    const result = await unblockUserAction(null, formDataFor({ blockedId: BLOCKED_ID }));

    expect(fromMock).toHaveBeenCalledWith('blocks');
    expect(eqBlockerMock).toHaveBeenCalledWith('blocker_id', 'user-1');
    expect(eqBlockedMock).toHaveBeenCalledWith('blocked_id', BLOCKED_ID);
    expect(result).toEqual({ success: true, data: undefined });
  });
});
