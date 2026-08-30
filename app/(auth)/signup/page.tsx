'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupAction } from '../actions';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-bold">新規登録</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          種別
          <select
            name="role"
            defaultValue="student"
            className="rounded border px-3 py-2"
          >
            <option value="student">学生として登録</option>
            <option value="mentor">メンターとして登録</option>
          </select>
        </label>
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
            minLength={8}
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
          {pending ? '登録中...' : '登録する'}
        </button>
      </form>
      <p className="text-sm">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="underline">
          ログイン
        </Link>
      </p>
    </main>
  );
}
