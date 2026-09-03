'use client';

import { useActionState } from 'react';
import { unblockUserAction } from '../block-actions';

export function UnblockButton({ blockedId }: { blockedId: string }) {
  const [state, formAction, pending] = useActionState(unblockUserAction, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="blockedId" value={blockedId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-border px-3 py-1 text-sm text-foreground transition hover:bg-background disabled:opacity-50"
        >
          解除
        </button>
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
