import { describe, expect, it } from 'vitest';
import { countUnreadByMatch } from './get-unread-counts';

describe('countUnreadByMatch', () => {
  it('counts unread rows per match_id', () => {
    const result = countUnreadByMatch([
      { match_id: 'match-1' },
      { match_id: 'match-1' },
      { match_id: 'match-2' },
    ]);

    expect(result).toEqual({ 'match-1': 2, 'match-2': 1 });
  });

  it('returns an empty object for no unread rows', () => {
    expect(countUnreadByMatch([])).toEqual({});
  });
});
