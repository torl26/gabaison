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

import { createBadgeDefinitionAction } from './badge-actions';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('createBadgeDefinitionAction', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
  });

  it('rejects an empty label before touching Supabase', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });

    const result = await createBadgeDefinitionAction(
      null,
      formDataFor({ label: '', imageUrl: 'https://example.com/badge.png' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects a missing/invalid image URL before touching Supabase', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });

    const result = await createBadgeDefinitionAction(
      null,
      formDataFor({ label: 'ハッカソン参加', imageUrl: '' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a manual badge_definitions row created by the admin', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });

    const result = await createBadgeDefinitionAction(
      null,
      formDataFor({ label: 'ハッカソン参加', imageUrl: 'https://example.com/badge.png' })
    );

    expect(fromMock).toHaveBeenCalledWith('badge_definitions');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'ハッカソン参加',
        image_url: 'https://example.com/badge.png',
        source: 'manual',
        created_by: 'admin-1',
      })
    );
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the insert fails', async () => {
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: { message: 'boom' } });

    const result = await createBadgeDefinitionAction(
      null,
      formDataFor({ label: 'ハッカソン参加', imageUrl: 'https://example.com/badge.png' })
    );

    expect(result.success).toBe(false);
  });
});
