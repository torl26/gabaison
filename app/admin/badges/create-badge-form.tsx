'use client';

import { useActionState } from 'react';
import { createBadgeDefinitionAction } from './badge-actions';

export function CreateBadgeForm() {
  const [state, formAction, pending] = useActionState(createBadgeDefinitionAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        アイコン
        <input
          name="icon"
          required
          maxLength={8}
          placeholder="🎉"
          className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        ラベル
        <input
          name="label"
          required
          maxLength={50}
          placeholder="ハッカソン参加"
          className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '作成中...' : '作成する'}
      </button>
      {state && !state.success && (
        <p className="w-full text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
