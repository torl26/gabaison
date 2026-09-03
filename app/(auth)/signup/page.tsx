'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupAction } from '../actions';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#fcf6eb] text-[#17263d]">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#f5c45b]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-[#e16f4d]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[12%] top-[16%] size-56 rounded-full border border-[#e16f4d]/15" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(23,38,61,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(23,38,61,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-between gap-12 px-5 py-7 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:gap-20 lg:px-10">
        <section className="max-w-xl">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="TechTiesトップへ戻る">
            <span className="relative flex size-11 items-center justify-center rounded-2xl bg-[#e16f4d] text-xl text-[#fff8ed] shadow-[0_12px_26px_-13px_rgba(196,85,54,0.9)] transition-transform duration-200 group-hover:-rotate-6">
              ♡
              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#f5c45b] ring-2 ring-[#fcf6eb]" />
            </span>
            <span className="font-serif text-[1.55rem] font-extrabold tracking-[-0.06em] text-[#17263d]">TechTies</span>
          </Link>
          <div className="mt-16 max-w-md lg:mt-24">
            <p className="mb-5 flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#c85f41]"><span className="h-px w-8 bg-[#c85f41]" />Start your tie</p>
            <h1 className="max-w-[10em] font-sans text-[clamp(2.15rem,5vw,4.7rem)] font-extrabold leading-[1.12] tracking-[-0.07em] text-[#17263d] [text-wrap:balance]"><span className="block whitespace-nowrap">小さく始める。</span><span className="block whitespace-nowrap text-[#c85f41]">つながっていく。</span></h1>
            <p className="mt-7 max-w-sm text-pretty text-sm leading-8 text-[#17263d]/60">相談したい人も、経験を渡したい人も。<br className="hidden sm:block" />あなたに合う役割から始められます。</p>
          </div>
        </section>

        <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-[#fffaf3]/90 p-6 shadow-[0_30px_70px_-36px_rgba(23,38,61,0.42)] backdrop-blur-xl sm:p-9">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c85f41]">Create account</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17263d]">新規登録</h2>
            <p className="mt-2 text-sm leading-6 text-[#17263d]/55">まずは役割を選んで、アカウントを作成してください。</p>
          </div>
          <form action={formAction} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/70">
              参加方法
              <select name="role" defaultValue="student" className="rounded-2xl border border-[#17263d]/12 bg-white/70 px-4 py-3.5 text-[#17263d] outline-none transition focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10">
                <option value="student">学生として相談する</option>
                <option value="mentor">メンターとして参加する</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/70">
              メールアドレス
              <input type="email" name="email" required autoComplete="email" className="rounded-2xl border border-[#17263d]/12 bg-white/70 px-4 py-3.5 text-[#17263d] outline-none transition placeholder:text-[#17263d]/30 focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/70">
              パスワード
              <input type="password" name="password" required minLength={8} autoComplete="new-password" className="rounded-2xl border border-[#17263d]/12 bg-white/70 px-4 py-3.5 text-[#17263d] outline-none transition placeholder:text-[#17263d]/30 focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10" />
              <span className="text-xs font-normal leading-5 text-[#17263d]/45">8文字以上で設定してください。</span>
            </label>
            {state && !state.success && <p role="alert" className="rounded-xl bg-[#e16f4d]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#a84c33]">{state.error}</p>}
            <button type="submit" disabled={pending} className="mt-1 inline-flex items-center justify-center rounded-full bg-[#e16f4d] px-5 py-3.5 text-sm font-bold text-[#fff8ed] shadow-[0_16px_30px_-16px_rgba(196,85,54,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#cf5f40] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? '登録中...' : 'アカウントを作成する'}
            </button>
          </form>
          <p className="mt-7 border-t border-[#17263d]/10 pt-6 text-center text-sm text-[#17263d]/55">すでにアカウントをお持ちの方は{' '}<Link href="/login" className="font-bold text-[#c85f41] underline decoration-[#c85f41]/30 underline-offset-4 transition-colors hover:text-[#a84c33]">ログイン</Link></p>
        </section>
      </div>
    </main>
  );
}
