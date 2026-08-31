import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, updateMock, eqMock, revalidatePathMock } = vi.hoisted(
  () => ({
    getCurrentUserMock: vi.fn(),
    fromMock: vi.fn(),
    updateMock: vi.fn(),
    eqMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  })
);

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import { respondToMatchRequestAction } from './actions';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('respondToMatchRequestAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await respondToMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID, decision: 'accepted' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid decision before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'mentor-1' });

    const result = await respondToMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID, decision: 'pending' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('updates the request status and revalidates /requests on success', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'mentor-1' });
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const result = await respondToMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID, decision: 'accepted' })
    );

    expect(fromMock).toHaveBeenCalledWith('match_requests');
    expect(updateMock).toHaveBeenCalledWith({ status: 'accepted' });
    expect(eqMock).toHaveBeenCalledWith('id', REQUEST_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith('/requests');
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the update fails (e.g. not the mentor of this request)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    eqMock.mockResolvedValue({ error: { message: 'boom' } });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const result = await respondToMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID, decision: 'rejected' })
    );

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
