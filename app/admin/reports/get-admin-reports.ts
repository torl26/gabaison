import type { createClient } from '@/lib/supabase/server';
import { REPORT_REASON_LABELS, type ReportReason } from '@/lib/constants/report-reasons';

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  created_at: string;
}

export interface ReporterProfileRow {
  id: string;
  name: string;
}

export interface AdminReportRow {
  id: string;
  reporterName: string;
  reportedName: string;
  reasonLabel: string;
  createdAt: string;
}

export function buildAdminReports(
  rows: ReportRow[],
  profiles: ReporterProfileRow[]
): AdminReportRow[] {
  const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return rows.map((row) => ({
    id: row.id,
    reporterName: nameById.get(row.reporter_id) ?? '不明なユーザー',
    reportedName: nameById.get(row.reported_id) ?? '不明なユーザー',
    reasonLabel: REPORT_REASON_LABELS[row.reason],
    createdAt: row.created_at,
  }));
}

export async function fetchAdminReports(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminReportRow[]> {
  const { data } = await supabase
    .from('reports')
    .select('id, reporter_id, reported_id, reason, created_at')
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as unknown as ReportRow[];
  const userIds = Array.from(new Set(rows.flatMap((row) => [row.reporter_id, row.reported_id])));

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, name').in('id', userIds)
    : { data: [] as ReporterProfileRow[] };

  return buildAdminReports(rows, (profiles ?? []) as unknown as ReporterProfileRow[]);
}
