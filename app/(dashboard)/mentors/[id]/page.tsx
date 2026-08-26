export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold">メンター詳細</h1>
      <p className="text-sm text-gray-500">mentorId: {id}</p>
      {/* TODO: 担当者がメンター情報表示・マッチング申請フォームを実装 */}
    </div>
  );
}
