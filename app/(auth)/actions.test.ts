import { afterEach, describe, expect, it, vi } from 'vitest';

const { signUpMock, fromMock, redirectMock } = vi.hoisted(() => ({
  signUpMock: vi.fn(),
  fromMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({ auth: { signUp: signUpMock }, from: fromMock }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import { signupAction } from './actions';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('signupAction', () => {
  afterEach(() => {
    signUpMock.mockReset();
    fromMock.mockReset();
    redirectMock.mockClear();
  });

  it('passes role and name as signup metadata instead of inserting into profiles directly', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: { access_token: 'token' } },
      error: null,
    });

    await expect(
      signupAction(
        null,
        formDataFor({
          email: 'student@example.com',
          password: 'password123',
          role: 'student',
        })
      )
    ).rejects.toThrow('REDIRECT:/profile/edit');

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'password123',
      options: { data: { role: 'student', name: 'student' } },
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('sends an unconfirmed signup (no session yet) to the check-email page instead', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });

    await expect(
      signupAction(
        null,
        formDataFor({
          email: 'student@example.com',
          password: 'password123',
          role: 'student',
        })
      )
    ).rejects.toThrow('REDIRECT:/signup/check-email');
  });
});
