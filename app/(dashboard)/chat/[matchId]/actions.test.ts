import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  getCurrentUserMock,
  fromMock,
  insertMock,
  selectMock,
  singleMock,
  updateMock,
  eqMock,
  neqMock,
  isMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  neqMock: vi.fn(),
  isMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

import { sendMessageAction, markMessagesAsRead } from './actions';

const MATCH_ID = '22222222-2222-4222-8222-222222222222';

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe('sendMessageAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
    selectMock.mockReset();
    singleMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await sendMessageAction(
      null,
      formDataFor({ matchId: MATCH_ID, content: 'こんにちは' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an empty message before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });

    const result = await sendMessageAction(
      null,
      formDataFor({ matchId: MATCH_ID, content: '' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a message and returns the inserted row, so the sender does not have to wait for realtime', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    const insertedRow = {
      id: 'msg-1',
      match_id: MATCH_ID,
      sender_id: 'student-1',
      content: 'こんにちは',
      created_at: '2026-08-01T00:00:00Z',
    };
    singleMock.mockResolvedValue({ data: insertedRow, error: null });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ insert: insertMock });

    const result = await sendMessageAction(
      null,
      formDataFor({ matchId: MATCH_ID, content: 'こんにちは' })
    );

    expect(fromMock).toHaveBeenCalledWith('messages');
    expect(insertMock).toHaveBeenCalledWith({
      match_id: MATCH_ID,
      sender_id: 'student-1',
      content: 'こんにちは',
    });
    expect(result).toEqual({ success: true, data: insertedRow });
  });

  it('returns an error when the insert fails (e.g. not an accepted participant)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    singleMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ insert: insertMock });

    const result = await sendMessageAction(
      null,
      formDataFor({ matchId: MATCH_ID, content: 'こんにちは' })
    );

    expect(result.success).toBe(false);
  });
});

describe('markMessagesAsRead', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    neqMock.mockReset();
    isMock.mockReset();
  });

  it('does nothing when nobody is logged in', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await markMessagesAsRead(MATCH_ID);

    expect(fromMock).not.toHaveBeenCalled();
  });

  it("marks the other participant's unread messages as read", async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    isMock.mockResolvedValue({ error: null });
    neqMock.mockReturnValue({ is: isMock });
    eqMock.mockReturnValue({ neq: neqMock });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    await markMessagesAsRead(MATCH_ID);

    expect(fromMock).toHaveBeenCalledWith('messages');
    expect(updateMock).toHaveBeenCalledWith({ read_at: expect.any(String) });
    expect(eqMock).toHaveBeenCalledWith('match_id', MATCH_ID);
    expect(neqMock).toHaveBeenCalledWith('sender_id', 'student-1');
    expect(isMock).toHaveBeenCalledWith('read_at', null);
  });
});
