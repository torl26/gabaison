import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { fetchAdminReports } from './get-admin-reports';

export default async function AdminReportsPage() {
  await requireAdmin();

  const supabase = await createClient();
  const reports = await fetchAdminReports(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">通報一覧</h1>

      {reports.length === 0 ? (
        <p className="text-sm text-muted">通報はありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground">{report.reporterName}</span>
                <span className="text-sm text-muted">→</span>
                <span className="font-bold text-foreground">{report.reportedName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {report.reasonLabel}
                </span>
              </div>
              <p className="text-xs text-muted">
                {new Date(report.createdAt).toLocaleString('ja-JP')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
