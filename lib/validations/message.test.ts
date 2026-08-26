import { describe, expect, it } from 'vitest';
import { messageSchema } from './message';

const MATCH_ID = '22222222-2222-4222-8222-222222222222';

describe('messageSchema', () => {
  it('accepts a valid message', () => {
    const result = messageSchema.safeParse({
      matchId: MATCH_ID,
      content: 'こんにちは',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty message', () => {
    const result = messageSchema.safeParse({ matchId: MATCH_ID, content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid matchId', () => {
    const result = messageSchema.safeParse({
      matchId: 'not-a-uuid',
      content: 'こんにちは',
    });
    expect(result.success).toBe(false);
  });
});
