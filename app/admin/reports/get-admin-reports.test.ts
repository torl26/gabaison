import { describe, expect, it } from 'vitest';
import { buildAdminReports, type ReportRow, type ReporterProfileRow } from './get-admin-reports';

function reportRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: 'report-1',
    reporter_id: 'user-1',
    reported_id: 'user-2',
    reason: 'spam',
    created_at: '2026-09-03T00:00:00.000Z',
    ...overrides,
  };
}

const PROFILES: ReporterProfileRow[] = [
  { id: 'user-1', name: '通報した人' },
  { id: 'user-2', name: '通報された人' },
];

describe('buildAdminReports', () => {
  it('resolves reporter and reported names and the reason label', () => {
    const result = buildAdminReports([reportRow()], PROFILES);

    expect(result).toEqual([
      {
        id: 'report-1',
        reporterName: '通報した人',
        reportedName: '通報された人',
        reasonLabel: 'スパム',
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ]);
  });

  it('falls back to a placeholder name when a profile is missing', () => {
    const result = buildAdminReports([reportRow({ reporter_id: 'missing-user' })], PROFILES);

    expect(result[0].reporterName).toBe('不明なユーザー');
  });
});
