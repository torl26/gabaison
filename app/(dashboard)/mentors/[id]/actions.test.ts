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

import { requestMatchAction } from './actions';

const MENTOR_ID = '11111111-1111-4111-8111-111111111111';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

function mockCategoryLookup(categoryId: number) {
  fromMock.mockImplementation((table: string) => {
    if (table === 'categories') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { id: categoryId }, error: null }),
          }),
        }),
      };
    }
    if (table === 'match_requests') {
      return { insert: insertMock };
    }
    throw new Error(`unexpected table: ${table}`);
  });
}

describe('requestMatchAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await requestMatchAction(
      null,
      formDataFor({ mentorId: MENTOR_ID, categoryKey: 'career' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid category key before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });

    const result = await requestMatchAction(
      null,
      formDataFor({ mentorId: MENTOR_ID, categoryKey: 'unknown' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a match_request with the current user as student and the resolved category id', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    mockCategoryLookup(3);
    insertMock.mockResolvedValue({ error: null });

    const result = await requestMatchAction(
      null,
      formDataFor({
        mentorId: MENTOR_ID,
        categoryKey: 'skill',
        message: 'よろしくお願いします',
      })
    );

    expect(insertMock).toHaveBeenCalledWith({
      student_id: 'student-1',
      mentor_id: MENTOR_ID,
      category_id: 3,
      message: 'よろしくお願いします',
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the insert fails', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    mockCategoryLookup(1);
    insertMock.mockResolvedValue({ error: { message: 'boom' } });

    const result = await requestMatchAction(
      null,
      formDataFor({ mentorId: MENTOR_ID, categoryKey: 'career' })
    );

    expect(result.success).toBe(false);
  });
});
