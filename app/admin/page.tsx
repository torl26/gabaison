import { createClient } from '@/lib/supabase/server';
import { fetchAdminStats } from './get-admin-stats';

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const stats = await fetchAdminStats(supabase);

  const cards = [
    { label: '学生数', value: stats.studentCount },
    { label: 'メンター数', value: stats.mentorCount },
    { label: '審査中の申請', value: stats.pendingRequestCount },
    { label: '承認済みの申請', value: stats.acceptedRequestCount },
    { label: '却下された申請', value: stats.rejectedRequestCount },
    { label: '総メッセージ数', value: stats.messageCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">概要</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
