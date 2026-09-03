import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { fetchManualBadgeDefinitions } from '@/lib/badges/get-badge-definitions';
import { CreateBadgeForm } from './create-badge-form';

export default async function AdminBadgesPage() {
  await requireAdmin();

  const supabase = await createClient();
  const badges = await fetchManualBadgeDefinitions(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">バッジ管理</h1>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-foreground">新しいバッジを作成</h2>
        <CreateBadgeForm />
      </section>

      {badges.length === 0 ? (
        <p className="text-sm text-muted">まだバッジがありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {badges.map((badge) => (
            <li
              key={badge.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <span className="text-xl" aria-hidden="true">
                {badge.icon}
              </span>
              <span className="font-bold text-foreground">{badge.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
