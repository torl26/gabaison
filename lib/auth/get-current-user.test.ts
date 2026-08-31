import { afterEach, describe, expect, it, vi } from 'vitest';

const getUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: getUserMock } }),
}));

import { getCurrentUser } from './get-current-user';

describe('getCurrentUser', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    getUserMock.mockReset();
  });

  it('returns the real signed-in user even when SKIP_AUTH is true', async () => {
    vi.stubEnv('SKIP_AUTH', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    getUserMock.mockResolvedValue({
      data: { user: { id: 'real-id', email: 'real@example.com' } },
    });

    const user = await getCurrentUser();

    expect(user).toEqual({ id: 'real-id', email: 'real@example.com' });
  });

  it('falls back to a fixed dev user when SKIP_AUTH is true and nobody is signed in', async () => {
    vi.stubEnv('SKIP_AUTH', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    getUserMock.mockResolvedValue({ data: { user: null } });

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'dev@example.com',
    });
  });

  it('ignores SKIP_AUTH in production when nobody is signed in', async () => {
    vi.stubEnv('SKIP_AUTH', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    getUserMock.mockResolvedValue({ data: { user: null } });

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });

  it('calls Supabase and returns null when nobody is signed in and SKIP_AUTH is off', async () => {
    vi.stubEnv('SKIP_AUTH', 'false');
    vi.stubEnv('NODE_ENV', 'development');
    getUserMock.mockResolvedValue({ data: { user: null } });

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });
});
