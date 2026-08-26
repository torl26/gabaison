import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">学生-メンター マッチング</h1>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          ログイン
        </Link>
        <Link href="/signup" className="rounded border border-black px-4 py-2">
          新規登録
        </Link>
      </div>
    </main>
  );
}
