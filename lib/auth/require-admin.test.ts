import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, fromMock, redirectMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import { requireAdmin } from './require-admin';

function mockProfileRole(role: string | null) {
  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: role ? { role } : null }),
      }),
    }),
  });
}

describe('requireAdmin', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    redirectMock.mockClear();
  });

  it('redirects to /login when nobody is signed in, without querying profiles', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('redirects to /home when the signed-in user is not an admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com' });
    mockProfileRole('student');

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/home');
  });

  it('redirects to /home when the profile row is missing entirely', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com' });
    mockProfileRole(null);

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/home');
  });

  it('returns the current user when they are an admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' });
    mockProfileRole('admin');

    const result = await requireAdmin();

    expect(result).toEqual({ id: 'admin-1', email: 'admin@example.com' });
  });
});
