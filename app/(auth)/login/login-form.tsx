'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '../actions';

export function LoginForm({ skipAuthEnabled }: { skipAuthEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          メールアドレス
          <input
            type="email"
            name="email"
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          パスワード
          <input
            type="password"
            name="password"
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        {state && !state.success && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      {skipAuthEnabled && (
        <Link href="/home" className="text-center text-sm text-primary underline">
          ログインをスキップ(開発用)
        </Link>
      )}
    </>
  );
}
