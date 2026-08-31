'use client';

import { useActionState } from 'react';
import { respondToMatchRequestAction } from './actions';

type Props = {
  requestId: string;
};

export function RequestActions({ requestId }: Props) {
  const [state, formAction, pending] = useActionState(respondToMatchRequestAction, null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form action={formAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="decision" value="accepted" />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            承認
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="decision" value="rejected" />
          <button
            type="submit"
            disabled={pending}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            却下
          </button>
        </form>
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </div>
  );
}
