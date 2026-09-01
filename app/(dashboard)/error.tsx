'use client';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-bold text-foreground">エラーが発生しました</h1>
      <p className="text-sm text-muted">
        ページの表示中に問題が発生しました。しばらくしてからもう一度お試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
      >
        再試行
      </button>
    </div>
  );
}
