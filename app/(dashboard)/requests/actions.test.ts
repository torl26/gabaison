import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  getCurrentUserMock,
  fromMock,
  updateMock,
  eqMock,
  insertMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  fromMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  insertMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: fromMock }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  cancelMatchRequestAction,
  completeMatchRequestAction,
  respondToMatchRequestAction,
  submitReviewAction,
} from './actions';

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

describe('cancelMatchRequestAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await cancelMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid requestId before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });

    const result = await cancelMatchRequestAction(
      null,
      formDataFor({ requestId: 'not-a-uuid' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('cancels the request and revalidates /requests on success', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const result = await cancelMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(fromMock).toHaveBeenCalledWith('match_requests');
    expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(eqMock).toHaveBeenCalledWith('id', REQUEST_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith('/requests');
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the update fails (e.g. not a pending request owned by this student)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    eqMock.mockResolvedValue({
      error: { message: 'student can only cancel a pending request' },
    });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const result = await cancelMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('completeMatchRequestAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await completeMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid requestId before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });

    const result = await completeMatchRequestAction(
      null,
      formDataFor({ requestId: 'not-a-uuid' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  function mockCompletionLookup(request: { mentor_id: string; status: string } | null) {
    const maybeSingle = vi.fn().mockResolvedValue({ data: request });
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    fromMock.mockReturnValue({ select, update: updateMock });
  }

  it('marks the request completed and revalidates /requests on success', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'mentor-1' });
    mockCompletionLookup({ mentor_id: 'mentor-1', status: 'accepted' });
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });

    const result = await completeMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(updateMock).toHaveBeenCalledWith({ status: 'completed' });
    expect(eqMock).toHaveBeenCalledWith('id', REQUEST_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith('/requests');
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the request was never accepted', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'mentor-1' });
    mockCompletionLookup({ mentor_id: 'mentor-1', status: 'pending' });

    const result = await completeMatchRequestAction(
      null,
      formDataFor({ requestId: REQUEST_ID })
    );

    expect(result.success).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('submitReviewAction', () => {
  afterEach(() => {
    getCurrentUserMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
    revalidatePathMock.mockReset();
  });

  function mockRequestLookup(mentorId: string | null) {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: mentorId === null ? null : { mentor_id: mentorId },
    });
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });

    fromMock.mockImplementation((table: string) =>
      table === 'match_requests' ? { select } : { insert: insertMock }
    );
  }

  it('returns an error when nobody is logged in, without touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await submitReviewAction(
      null,
      formDataFor({ requestId: REQUEST_ID, rating: '5', comment: '' })
    );

    expect(result).toEqual({ success: false, error: 'ログインしてください' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects a rating outside 1-5 before touching Supabase', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });

    const result = await submitReviewAction(
      null,
      formDataFor({ requestId: REQUEST_ID, rating: '6', comment: '' })
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('takes the reviewee from the request rather than the form', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    mockRequestLookup('mentor-1');
    insertMock.mockResolvedValue({ error: null });

    const result = await submitReviewAction(
      null,
      formDataFor({
        requestId: REQUEST_ID,
        rating: '4',
        comment: 'ありがとうございました',
        revieweeId: 'attacker-controlled',
      })
    );

    expect(insertMock).toHaveBeenCalledWith({
      match_id: REQUEST_ID,
      reviewer_id: 'student-1',
      reviewee_id: 'mentor-1',
      rating: 4,
      comment: 'ありがとうございました',
    });
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns an error when the request cannot be read', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    mockRequestLookup(null);

    const result = await submitReviewAction(
      null,
      formDataFor({ requestId: REQUEST_ID, rating: '5', comment: '' })
    );

    expect(result).toEqual({ success: false, error: '対象の申請が見つかりません' });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('returns an error when the insert is refused (e.g. not a completed match)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'student-1' });
    mockRequestLookup('mentor-1');
    insertMock.mockResolvedValue({ error: { message: 'new row violates row-level security' } });

    const result = await submitReviewAction(
      null,
      formDataFor({ requestId: REQUEST_ID, rating: '5', comment: '' })
    );

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
