import { describe, expect, it } from 'vitest';
import { respondToRequestSchema } from './respond-to-request';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

describe('respondToRequestSchema', () => {
  it('accepts an accept decision', () => {
    const result = respondToRequestSchema.safeParse({
      requestId: REQUEST_ID,
      decision: 'accepted',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a reject decision', () => {
    const result = respondToRequestSchema.safeParse({
      requestId: REQUEST_ID,
      decision: 'rejected',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid requestId', () => {
    const result = respondToRequestSchema.safeParse({
      requestId: 'not-a-uuid',
      decision: 'accepted',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown decision', () => {
    const result = respondToRequestSchema.safeParse({
      requestId: REQUEST_ID,
      decision: 'pending',
    });
    expect(result.success).toBe(false);
  });
});
