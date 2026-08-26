import { describe, expect, it } from 'vitest';
import { matchRequestSchema } from './match-request';

const MENTOR_ID = '11111111-1111-4111-8111-111111111111';

describe('matchRequestSchema', () => {
  it('accepts a valid match request', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'career',
      message: 'よろしくお願いします。',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a match request without a message', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'career',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid mentorId', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: 'not-a-uuid',
      categoryKey: 'career',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category key', () => {
    const result = matchRequestSchema.safeParse({
      mentorId: MENTOR_ID,
      categoryKey: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});
