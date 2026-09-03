'use client';

import { useActionState } from 'react';
import { completeMatchRequestAction } from './actions';

export function RequestCompleteAction({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(completeMatchRequestAction, null);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1 text-sm text-foreground transition hover:bg-background disabled:opacity-50"
        >
          {pending ? '更新中...' : '相談を完了にする'}
        </button>
      </form>
      {state && !state.success && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
