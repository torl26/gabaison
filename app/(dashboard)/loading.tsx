export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="h-24 rounded bg-gray-100" />
      <div className="h-24 rounded bg-gray-100" />
    </div>
  );
}
