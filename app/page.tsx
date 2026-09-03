import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 animate-[pulse-glow_6s_ease-in-out_infinite] rounded-full bg-primary/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-28 h-96 w-96 animate-[pulse-glow_7s_ease-in-out_infinite_1s] rounded-full bg-amber-400/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[20%] h-52 w-52 rounded-full bg-rose-400/30 blur-2xl" />

      <span className="pointer-events-none absolute left-[12%] top-[12%] animate-[float_5s_ease-in-out_infinite] text-2xl">
        ✨
      </span>
      <span className="pointer-events-none absolute right-[14%] top-[18%] animate-[float-slow_4.5s_ease-in-out_infinite_0.4s] text-xl">
        🎉
      </span>
      <span className="pointer-events-none absolute bottom-[16%] left-[10%] animate-[float-slow_5.5s_ease-in-out_infinite_0.8s] text-2xl">
        🌟
      </span>
      <span className="pointer-events-none absolute bottom-[22%] right-[10%] animate-[float_4.8s_ease-in-out_infinite_0.2s] text-xl">
        ✨
      </span>
      <span className="pointer-events-none absolute left-[44%] top-[8%] h-3.5 w-3.5 animate-[float_4s_ease-in-out_infinite_0.6s] rounded-full bg-amber-400" />
      <span className="pointer-events-none absolute bottom-[10%] left-[38%] h-2.5 w-2.5 animate-[float-slow_4.2s_ease-in-out_infinite_0.3s] rounded-full bg-rose-400" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-[2rem] border border-white bg-white/90 p-9 text-center shadow-[0_24px_60px_-12px_rgba(217,119,87,0.28),0_8px_24px_-8px_rgba(68,64,60,0.12)] backdrop-blur-sm sm:p-12">
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-amber-400 text-4xl shadow-[0_10px_24px_-6px_rgba(217,119,87,0.5)]">
          🤝
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">TechTies</span>
          <h1 className="mt-1 text-3xl font-bold leading-snug text-foreground">
            新しい出会いを、
            <br />
            はじめよう
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            気軽に話せるメンターと出会える、
            <br />
            あたたかいコミュニティへようこそ。
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary/80 px-6 py-4 text-base font-bold text-primary-foreground shadow-[0_12px_24px_-8px_rgba(217,119,87,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-8px_rgba(217,119,87,0.65)]"
          >
            ログイン <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 px-6 py-4 text-base font-bold text-amber-800 shadow-[0_8px_20px_-10px_rgba(242,184,75,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(242,184,75,0.75)]"
          >
            新規登録 <span aria-hidden="true">✨</span>
          </Link>
        </div>

        <p className="mt-1 text-xs text-muted">登録はたった1分。まずは気軽にのぞいてみましょう 🎈</p>
      </div>
    </main>
  );
}
