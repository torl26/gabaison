export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold">チャット</h1>
      <p className="text-sm text-gray-500">matchId: {matchId}</p>
      {/* TODO: 担当者がメッセージ一覧・送信フォーム・Realtime購読を実装 */}
    </div>
  );
}
