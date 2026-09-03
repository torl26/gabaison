'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '../actions';

export function LoginForm({ skipAuthEnabled }: { skipAuthEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/70">
          メールアドレス
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-[#17263d]/12 bg-white/70 px-4 py-3.5 text-[#17263d] outline-none transition placeholder:text-[#17263d]/30 focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/70">
          パスワード
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-2xl border border-[#17263d]/12 bg-white/70 px-4 py-3.5 text-[#17263d] outline-none transition placeholder:text-[#17263d]/30 focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10"
          />
        </label>
        {state && !state.success && (
          <p role="alert" className="rounded-xl bg-[#e16f4d]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#a84c33]">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-[#e16f4d] px-5 py-3.5 text-sm font-bold text-[#fff8ed] shadow-[0_16px_30px_-16px_rgba(196,85,54,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#cf5f40] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'ログイン中...' : 'ログインする'}
        </button>
      </form>
      {skipAuthEnabled && (
        <Link href="/home" className="mt-5 block text-center text-sm font-semibold text-[#c85f41] underline decoration-[#c85f41]/30 underline-offset-4">
          ログインをスキップ（開発用）
        </Link>
      )}
    </>
  );
}
