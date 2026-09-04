import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcf6eb] px-5 py-10 text-[#17263d]">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#f5c45b]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-[#e16f4d]/20 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/80 bg-[#fffaf3]/90 p-8 text-center shadow-[0_30px_70px_-36px_rgba(23,38,61,0.42)] backdrop-blur-xl sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e16f4d]/15 text-2xl text-[#e16f4d]">✉</span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#c85f41]">Check your inbox</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17263d]">確認メールを送信しました</h1>
        <p className="mt-4 text-sm leading-7 text-[#17263d]/60">
          登録したメールアドレスに確認メールを送信しました。メール内のリンクをクリックすると、アカウントが有効になります。
        </p>
        <p className="mt-3 text-xs leading-6 text-[#17263d]/45">
          メールが届かない場合は、迷惑メールフォルダをご確認いただくか、しばらく経ってから再度お試しください。
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#e16f4d] px-6 py-3.5 text-sm font-bold text-[#fff8ed] shadow-[0_16px_30px_-16px_rgba(196,85,54,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#cf5f40] active:scale-[0.97]"
        >
          ログイン画面へ
        </Link>
      </section>
    </main>
  );
}
