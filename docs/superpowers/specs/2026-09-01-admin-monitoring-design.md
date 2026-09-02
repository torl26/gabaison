# 管理者モニタリング機能 設計書

- 作成日: 2026-09-01
- 対象: `docs/superpowers/specs/2026-08-26-mentor-matching-design.md` のスコープ外項目
  「管理者用ダッシュボード」のうち、モニタリング機能のみを切り出したもの

## 1. 目的・背景

現状、アプリ全体の状態（ユーザー数、マッチング申請の状況、チャットの活動量）を俯瞰する手段がない。
運営者がサービスの利用状況を把握し、個別ユーザーの調査（トラブル対応など）ができるようにする。

ユーザー管理（削除・BAN等）や通報対応は今回のスコープに含めない。あくまで「見る」ことに限定する。

## 2. スコープ

### 含む

1. 全体の統計（ユーザー数、申請ステータス別件数、総メッセージ数）を見る概要画面
2. 全ユーザーの一覧（ロールで絞り込み可能）
3. 個別ユーザーの詳細（プロフィール + 関わったマッチング申請 + メッセージ数）

### 含まない（将来の拡張候補）

- ユーザーの削除・BAN・強制ログアウト
- マッチング申請・メッセージの削除やモデレーション
- 管理者の招待・昇格をアプリ内で行うUI（最初のadminは手動でDBを書き換えて作成する）
- メールアドレスの表示（`auth.users` の内容は今回表示しない）
- 集計のグラフ化・期間指定・エクスポート

## 3. アクセス制御

### 3.1 admin判定

`profiles.role = 'admin'` を管理者の判定基準とする。現在のサインアップ画面では
`student` / `mentor` しか選べない仕様のままとし、最初のadminユーザーはSQLで
直接 `update profiles set role = 'admin' where id = '...'` して作成する。
アプリ内での admin 昇格 UI は作らない。

### 3.2 RLS

このアプリはこれまで一貫して、通常のユーザーセッション + RLS のみで認可を行っており、
service role key のような特権クレデンシャルは一切登場しない。今回もその方針を踏襲する。

`match_requests` と `messages` の SELECT ポリシーは、現状「当事者（student/mentor）のみ」
に絞られており、管理者であっても他人の申請やメッセージは見えない。これを緩和するため、
以下の SQL 関数を追加する。

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
```

そのうえで、`match_requests_select_participant` と `messages_select_participant` の
`using` 句に `or public.is_admin()` を追加する（`drop policy` → `create policy` で再作成）。

`profiles` は既存の `profiles_select_authenticated`（`using (true)`）で全authenticated
ユーザーが閲覧可能なため、変更不要。`mentor_categories` も同様に変更不要。

### 3.3 アプリ側のガード

`lib/auth/require-admin.ts` に `requireAdmin()` を追加する。

```ts
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/home');
  return user;
}
```

各 `app/admin/**` 配下の Server Component の先頭でこれを呼ぶ。

## 4. 画面構成

既存の `app/(dashboard)` とは別の `app/admin` セクションを新設する（学生/メンター向けの
ナビゲーションは出さない、専用の最小限のヘッダーを持つ）。

```
app/admin/
├── layout.tsx          # requireAdmin() ガード + 管理画面用ヘッダー・ナビ
├── page.tsx             # 概要（統計カード）
├── get-admin-stats.ts   # fetchAdminStats()
├── users/
│   ├── page.tsx          # ユーザー一覧（ロール絞り込み）
│   ├── get-admin-users.ts
│   └── [id]/
│       ├── page.tsx      # 個別ユーザー詳細
│       └── get-user-detail.ts
```

### 4.1 `app/admin/page.tsx`（概要）

`fetchAdminStats(supabase)` が返す以下を表示する:

- 学生数 / メンター数
- マッチング申請: 審査中 / 承認済み / 却下 の件数
- 総メッセージ数

すべて `count: 'exact', head: true` のカウントクエリで取得する（行データそのものは取得しない）。

### 4.2 `app/admin/users/page.tsx`（ユーザー一覧）

`fetchAllUsers(supabase, roleFilter?)` が返す `{ id, name, role, createdAt }[]` を一覧表示。
`?role=student|mentor` のクエリパラメータでロール絞り込み（`/mentors` の
カテゴリ絞り込みと同じ `<Link href>` パターン）。各行から `/admin/users/[id]` へリンク。

### 4.3 `app/admin/users/[id]/page.tsx`（個別ユーザー詳細）

`fetchUserDetail(supabase, userId)` が返す:

```ts
interface UserDetail {
  id: string;
  name: string;
  role: ProfileRole;
  bio: string;
  createdAt: string;
  messageCount: number;
}
```

マッチング申請の一覧は、新しく専用の関数を作らず、既存の
`fetchMatchRequests(supabase, userId)`（`app/(dashboard)/requests/get-requests.ts`）を
そのまま再利用する。この関数はもともと「指定ユーザーが student/mentor どちらかとして
関わっている申請」を `isMentor` フラグ付きで返す設計になっており、対象を「今ログイン
している自分」から「調査対象のユーザー」に読み替えるだけでそのまま使える。画面側で
`isMentor` によって「学生として申請した分」「メンターとして受けた分」に分けて表示する。

ユーザーが存在しなければ `fetchUserDetail` が `null` を返し、画面側で「見つかりません」を
表示する（`/mentors/[id]` や `/chat/[matchId]` の not-found パターンと同じ）。

## 5. エラー処理

- 未ログイン → `/login` にリダイレクト（`requireAdmin()` 内、`getCurrentUser()` が
  `null` を返すケース）
- ログイン済みだが admin でない → `/home` にリダイレクト（権限がないことを個別に
  説明する画面は作らず、静かにホームへ戻す）
- 個別ユーザー詳細で対象が存在しない → 「見つかりません」表示（他の詳細画面と同じ扱い）

## 6. テスト方針

既存の `get-mentors.ts` / `get-requests.ts` と同じ方針を踏襲する。

- 複数のクエリ結果を1つの表示用データにまとめる「純粋な変換ロジック」がある場合は
  そこだけをユニットテスト対象にする（例: `fetchUserDetail` 内で
  student/mentor 両方の申請リストを分類する部分など、切り出せるならテストする）
- 単純なカウントクエリ（`fetchAdminStats`）や一覧取得（`fetchAllUsers`）自体は、
  他の `fetch*` 関数と同様にユニットテスト対象外とする
- `requireAdmin()` はロジックが単純な分岐のみなので、`getCurrentUser()` と
  Supabase クライアントをモックしてテストする（`lib/auth/get-current-user.test.ts`
  と同じスタイル）
- マイグレーション（`is_admin()` 関数追加、RLSポリシー変更）は、既存の
  `supabase/migrations/*.test.ts` と同じ静的文字列アサーションでテストする

## 7. 未解決事項・確認事項

なし（本設計はブレインストーミングでの合意事項をそのまま文書化したもの）。
