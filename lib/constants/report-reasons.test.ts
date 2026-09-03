import { describe, expect, it } from 'vitest';
import { REPORT_REASON_KEYS, REPORT_REASON_LABELS } from './report-reasons';

describe('report reasons', () => {
  it('has exactly the five fixed reason keys, in order', () => {
    expect(REPORT_REASON_KEYS).toEqual([
      'spam',
      'harassment',
      'inappropriate_content',
      'impersonation',
      'other',
    ]);
  });

  it('has a non-empty label for every reason key', () => {
    for (const key of REPORT_REASON_KEYS) {
      expect(REPORT_REASON_LABELS[key].length).toBeGreaterThan(0);
    }
  });
});
