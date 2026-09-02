export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded-lg bg-border" />
      <div className="h-24 rounded-xl bg-surface" />
      <div className="h-24 rounded-xl bg-surface" />
    </div>
  );
}
