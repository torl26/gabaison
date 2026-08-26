import { describe, expect, it } from 'vitest';
import { err, ok } from './types';

describe('ok', () => {
  it('wraps data in a success result', () => {
    expect(ok({ id: '1' })).toEqual({ success: true, data: { id: '1' } });
  });
});

describe('err', () => {
  it('wraps a message in a failure result', () => {
    expect(err('something went wrong')).toEqual({
      success: false,
      error: 'something went wrong',
    });
  });
});
