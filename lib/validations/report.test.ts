import { describe, expect, it } from 'vitest';
import { reportUserSchema } from './report';

const REPORTED_ID = '11111111-1111-4111-8111-111111111111';

describe('reportUserSchema', () => {
  it('accepts a valid reason', () => {
    const result = reportUserSchema.safeParse({
      reportedId: REPORTED_ID,
      reason: 'spam',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid reportedId', () => {
    const result = reportUserSchema.safeParse({
      reportedId: 'not-a-uuid',
      reason: 'spam',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown reason', () => {
    const result = reportUserSchema.safeParse({
      reportedId: REPORTED_ID,
      reason: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});
