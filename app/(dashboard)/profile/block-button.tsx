'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockUserAction } from './block-actions';

export function BlockButton({
  blockedId,
  redirectTo,
}: {
  blockedId: string;
  redirectTo: string;
}) {
  const [state, formAction, pending] = useActionState(blockUserAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push(redirectTo);
    }
  }, [state, redirectTo, router]);

  return (
    <div className="flex flex-col gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              'このユーザーをブロックしますか？進行中のマッチングは終了扱いになります。'
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="blockedId" value={blockedId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
        >
          ブロック
        </button>
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
