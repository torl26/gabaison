'use client';

import { useActionState } from 'react';
import { awardBadgeAction } from './award-badge-actions';

export function AwardBadgeForm({
  userId,
  availableBadges,
}: {
  userId: string;
  availableBadges: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(awardBadgeAction, null);

  if (availableBadges.length === 0) {
    return <p className="text-xs text-muted">付与できるバッジがありません。</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="badgeDefinitionId"
        required
        defaultValue=""
        className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
      >
        <option value="" disabled>
          バッジを選択
        </option>
        {availableBadges.map((badge) => (
          <option key={badge.id} value={badge.id}>
            {badge.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '付与中...' : '付与する'}
      </button>
      {state && !state.success && (
        <p className="w-full text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
