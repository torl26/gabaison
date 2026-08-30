import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
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

import { updateProfile } from './actions';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('updateProfile', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
  });

  it('returns an error via getCurrentUser() instead of calling Supabase auth directly', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await updateProfile(
      formDataFor({ name: 'テスト', bio: '' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
