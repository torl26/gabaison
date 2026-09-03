import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { fetchUserDetail } from './get-user-detail';
import { fetchMatchRequests } from '@/app/(dashboard)/requests/get-requests';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { STATUS_LABELS } from '@/lib/constants/match-request-status';
import { fetchUserBadges } from '@/lib/badges/get-user-badges';
import { fetchManualBadgeDefinitions } from '@/lib/badges/get-badge-definitions';
import { AwardBadgeForm } from './award-badge-form';
import { BadgeList } from '@/app/(dashboard)/profile/profile-details';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">ユーザー詳細</h1>
        <p className="mt-2 text-sm text-muted">見つかりません</p>
      </div>
    );
  }

  const supabase = await createClient();

  const detail = await fetchUserDetail(supabase, id);

  if (!detail) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">ユーザー詳細</h1>
        <p className="mt-2 text-sm text-muted">見つかりません</p>
      </div>
    );
  }

  const requests = await fetchMatchRequests(supabase, id);
  const asStudent = requests.filter((r) => !r.isMentor);
  const asMentor = requests.filter((r) => r.isMentor);

  const userBadges = await fetchUserBadges(supabase, id);
  const manualBadges = await fetchManualBadgeDefinitions(supabase);
  const availableBadges = manualBadges.filter(
    (badge) => !userBadges.some((userBadge) => userBadge.badgeDefinitionId === badge.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/users" className="text-sm text-primary underline">
          ← ユーザー一覧へ
        </Link>
        <h1 className="mt-2 text-xl font-bold text-foreground">{detail.name}</h1>
        <p className="text-sm text-muted">
          {ROLE_LABELS[detail.role]} ・ 登録日:{' '}
          {new Date(detail.createdAt).toLocaleDateString('ja-JP')}
        </p>
        {detail.bio && <p className="mt-2 text-sm text-foreground">{detail.bio}</p>}
        <p className="mt-2 text-sm text-muted">送信メッセージ数: {detail.messageCount}</p>
      </div>

      <div>
        <h2 className="font-bold text-foreground">バッジ ({userBadges.length})</h2>
        {userBadges.length === 0 ? (
          <p className="mt-1 text-sm text-muted">なし</p>
        ) : (
          <BadgeList badges={userBadges} />
        )}
        <div className="mt-3">
          <AwardBadgeForm userId={detail.id} availableBadges={availableBadges} />
        </div>
      </div>

      <div>
        <h2 className="font-bold text-foreground">学生として申請した分 ({asStudent.length})</h2>
        {asStudent.length === 0 ? (
          <p className="mt-1 text-sm text-muted">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {asStudent.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                {r.counterpartName} ・ {r.category.label} ・ {STATUS_LABELS[r.status]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-bold text-foreground">メンターとして受けた分 ({asMentor.length})</h2>
        {asMentor.length === 0 ? (
          <p className="mt-1 text-sm text-muted">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {asMentor.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                {r.counterpartName} ・ {r.category.label} ・ {STATUS_LABELS[r.status]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
