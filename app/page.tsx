import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold text-foreground">学生-メンター マッチング</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
        >
          ログイン
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-border px-4 py-2 text-foreground transition hover:bg-surface"
        >
          新規登録
        </Link>
      </div>
    </main>
  );
}
