'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '../actions';

export function LoginForm({ skipAuthEnabled }: { skipAuthEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          メールアドレス
          <input
            type="email"
            name="email"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          パスワード
          <input
            type="password"
            name="password"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        {state && !state.success && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      {skipAuthEnabled && (
        <Link href="/profile" className="text-center text-sm underline">
          ログインをスキップ(開発用)
        </Link>
      )}
    </>
  );
}
