import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, insertMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

import { reportUserAction } from './report-actions';

const REPORTED_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('reportUserAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'spam' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown reason before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'unknown' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a reports row with the current user as reporter', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'harassment' })
    );

    expect(fromMock).toHaveBeenCalledWith('reports');
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: 'user-1',
      reported_id: REPORTED_ID,
      reason: 'harassment',
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the insert fails', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { message: 'boom' } });

    const result = await reportUserAction(
      null,
      formDataFor({ reportedId: REPORTED_ID, reason: 'spam' })
    );

    expect(result.success).toBe(false);
  });
});
