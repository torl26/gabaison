'use client';

import { useActionState, useState } from 'react';
import { awardBadgeAction } from './award-badge-actions';

export function AwardBadgeForm({
  userId,
  availableBadges,
}: {
  userId: string;
  availableBadges: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(awardBadgeAction, null);
  const [formKey, setFormKey] = useState(0);

  // Reset the <select> after a successful award. Adjusting state during
  // render (rather than in a useEffect) avoids an extra render pass — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state?.success) {
      setFormKey((key) => key + 1);
    }
  }

  if (availableBadges.length === 0) {
    return <p className="text-xs text-muted">付与できるバッジがありません。</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <form key={formKey} action={formAction} className="flex flex-wrap items-center gap-2">
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
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">付与しました</p>}
    </div>
  );
}
