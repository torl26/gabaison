'use client';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-bold">エラーが発生しました</h1>
      <p className="text-sm text-gray-500">
        ページの表示中に問題が発生しました。しばらくしてからもう一度お試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-black px-4 py-2 text-sm text-white"
      >
        再試行
      </button>
    </div>
  );
}
