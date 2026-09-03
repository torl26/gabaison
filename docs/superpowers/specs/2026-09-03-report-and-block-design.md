# 通報・ブロック機能 設計書

- 作成日: 2026-09-03

## 1. 目的・背景

現状、迷惑な相手への対処手段がなく、ユーザーが不快な相手からのマッチング申請や
メッセージを避けられない。相手のプロフィール画面から「通報」「ブロック」ができる
ようにし、運営が問題行為を把握できる仕組みを追加する。

## 2. スコープ

### 含む

1. 相手のプロフィール画面（`/mentors/[id]`, `/users/[id]`）からの通報・ブロック
2. 通報: 理由カテゴリを選択して送信するのみ（自由記述なし）
3. ブロック: 以下すべてを防ぐ
   - マッチング申請の送受信
   - チャット・メッセージ送信
   - メンター一覧・検索結果への表示
   - プロフィールの閲覧
4. ブロック時点で相手との既存マッチング（`pending`/`accepted`）を自動で `cancelled` にする
5. ブロック中ユーザーの一覧・解除画面
6. 管理者向けの通報一覧画面（`/admin` 配下に新設）

### 含まない（将来の拡張候補）

- 通報理由の自由記述コメント
- 通報の対応状況管理（未対応/対応済みのステータス管理、担当者アサインなど）
- 通報されたユーザーへの通知・自動制裁（BAN等）
- ブロックされたことを相手に知らせる通知
- 過去のチャット履歴自体を閲覧不可にすること（送信のみ止める。チャット画面自体は
  既存の「`accepted` のみ閲覧可」ルールにより結果的にアクセスできなくなる）

## 3. データベース設計

### 3.1 `blocks` テーブル

```sql
create table public.blocks (
  blocker_id uuid not null references public.profiles(id),
  blocked_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks_select_own" on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "blocks_insert_own" on public.blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "blocks_delete_own" on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));
```

一方向の関係として保存する（Aが Bをブロックしても、Bが Aをブロックしたことには
ならない）。ただし「効果」は `is_blocked()` ヘルパーで双方向に判定するため、
ブロックされた側から見ても申請・閲覧が防がれる（後述）。

update ポリシーは作らない（ブロックの変更は delete → 必要なら再度 insert）。

### 3.2 `reports` テーブル

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_id uuid not null references public.profiles(id),
  reason text not null check (
    reason in ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')
  ),
  created_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_id)
);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "reports_select_admin" on public.reports
  for select to authenticated
  using (public.is_admin());
```

`reviews` テーブルと同様、update/delete ポリシーは作らない
（一度送信した通報は変更・削除不可の監査ログとして扱う）。通報者自身も
自分の送信履歴を読み返す手段は持たない（今回のスコープ外）。

理由カテゴリの日本語表示ラベルは `lib/constants/report-reasons.ts` に
`ROLE_LABELS` (`lib/constants/roles.ts`) と同じ形で定義する:

```ts
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'スパム',
  harassment: '迷惑行為・嫌がらせ',
  inappropriate_content: '不適切な内容',
  impersonation: 'なりすまし',
  other: 'その他',
};
```

### 3.3 `is_blocked()` ヘルパーと `profiles` の閲覧制限

```sql
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;
```

`profiles_select_authenticated` を次のように変更する:

```sql
drop policy "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or not public.is_blocked(id, (select auth.uid()))
  );
```

この1箇所の変更で、ブロック関係にある相手の `profiles` 行が SELECT 結果に
現れなくなる。これにより:

- `fetchMentors` / `fetchMentorById`（`app/(dashboard)/mentors/get-mentors.ts`）が
  ブロック関係にある相手を自動的に除外する（一覧からは単純に消え、詳細ページは
  既存の「メンターが見つかりません」表示になる）
- `fetchUserProfile`（`/users/[id]` が使う）も同様に「見つかりません」表示になる
- 自分の `/profile` は `id = auth.uid()` で常に見える

新しい「ブロックされているので非表示」という専用UIは作らず、既存の
not-found 分岐をそのまま利用する。

**注意:** この `profiles` 閲覧制限は双方向に働くため、ブロックした本人から見ても
ブロック相手の `profiles` 行は SELECT できなくなる。そのままでは 4.2 の
「ブロック中ユーザー一覧」で相手の名前・アバターを表示できない。そのため、
一覧表示専用に RLS を迂回する `SECURITY DEFINER` 関数を用意する:

```sql
create or replace function public.get_blocked_profiles()
returns table (id uuid, name text, avatar_url text, blocked_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.avatar_url, b.created_at as blocked_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;
```

`is_admin()` と同じ考え方で、「呼び出した本人が自分でブロックした相手」という
狭い範囲に限定して RLS を迂回するため安全である。4.2 の一覧画面はこの関数を
`supabase.rpc('get_blocked_profiles')` で呼び出して取得する（`profiles` テーブルへの
直接 SELECT は使わない）。

### 3.4 マッチング申請のブロック

`match_requests_insert_student` の `with check` にブロック判定を追加する:

```sql
drop policy "match_requests_insert_student" on public.match_requests;
create policy "match_requests_insert_student" on public.match_requests
  for insert to authenticated
  with check (
    (select auth.uid()) = student_id
    and not public.is_blocked(student_id, mentor_id)
  );
```

### 3.5 ブロック時の既存マッチング自動キャンセル

`blocks` への INSERT 後、両者間の `pending`/`accepted` な `match_requests` を
`cancelled` にするトリガーを追加する:

```sql
create or replace function public.cancel_matches_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.match_requests
  set status = 'cancelled'
  where status in ('pending', 'accepted')
    and (
      (student_id = new.blocker_id and mentor_id = new.blocked_id)
      or (student_id = new.blocked_id and mentor_id = new.blocker_id)
    );
  return new;
end;
$$;

create trigger on_block_cancel_matches
  after insert on public.blocks
  for each row
  execute function public.cancel_matches_on_block();
```

この `update` は既存の `enforce_match_request_update` トリガー（BEFORE UPDATE）を
必ず経由する。そのトリガーは現状「mentor は accepted/rejected にしか変更できない」
「student は pending からしか cancelled にできない」という当事者ベースの制限を
持っており、ブロックによる強制キャンセルはどちらの分岐にも当てはまらない
（例: mentor 側がブロックした結果、`accepted` → `cancelled` にしたいが、
現状のルールでは mentor はそれを直接できない）。そのため
`enforce_match_request_update` に一段先出しの分岐を追加する:

```sql
if new.status is distinct from old.status then
  if new.status = 'cancelled' and public.is_blocked(old.student_id, old.mentor_id) then
    -- ブロックに伴う強制キャンセルは当事者どちらの操作でも許可する
  elsif auth.uid() = old.mentor_id then
    ...
```

キャンセル後は、既存の `messages_insert_accepted_participant`
（`status = 'accepted'` 必須）により新規メッセージ送信が自動的に止まる。
チャット画面（`/chat/[matchId]`）も既存の
`if (context.status !== 'accepted')` 分岐により
「このマッチングはまだ承認されていません」表示となり、実質アクセス不可になる
（過去ログの既読/未読状態などは変更しない）。

## 4. 画面構成

### 4.1 通報・ブロックボタン（`/mentors/[id]`, `/users/[id]`）

両ページのヘッダー部分（名前・バッジの並び）に、自分自身ではない場合のみ
「通報する」「ブロック」の2つのボタン/リンクを追加する。

- 「通報する」: 理由カテゴリを選ぶ小さいフォーム（`<select>` + 送信ボタン）を
  その場に展開する。送信後は「通報しました」のメッセージに置き換える
  （二重送信防止のため、送信済みなら再度フォームは出さない設計にはしない —
  スコープ外。今回は単純に送信できれば良い）
- 「ブロック」: クリックすると即座に実行する（確認ダイアログはブラウザ標準の
  `confirm()` を使わず、押した後に取り消せる導線＝ブロック中一覧からの解除で
  代替する。誤操作防止の確認UIは今回のスコープ外）
- 両ボタンとも Server Action（`app/(dashboard)/profile/report-actions.ts` のような
  新規ファイル）経由で実装し、既存の `signOutAction` 等と同じ `'use server'` の
  パターンに従う

ブロック実行後は、対象ページ自体が「見つかりません」になる（3.3の効果）ため、
ブロックボタン押下後は一覧ページ（`/mentors` または `/chat`）にリダイレクトする。

### 4.2 ブロック中ユーザー一覧（新規: `/profile/blocked`）

`/profile` 画面に「ブロック中のユーザー」へのリンクを追加する（「編集する」
ボタンの近く）。新規ページで、自分がブロックした相手の一覧
（名前・アバター・ブロック日時）と「解除」ボタンを表示する。一覧の取得は
3.3 で追加した `get_blocked_profiles()` RPC を使う（`profiles` への直接 SELECT では
ブロック相手の行が見えないため）。解除は `blocks` 行の delete。

### 4.3 管理者向け通報一覧（新規: `/admin/reports`）

`app/admin/layout.tsx` の `ADMIN_NAV_ITEMS` に「通報一覧」を追加する。
一覧は通報日時の降順で、通報者名・被通報者名・理由ラベル・日時を表示する
（`app/admin/users/page.tsx` と同じテーブル/リストの見た目）。
対応状況の管理機能は持たない（読むだけ）。

## 5. エラー処理

- 自分自身に対する通報・ブロックはボタン自体を出さない（UI側で防止）ため、
  RLSの `not self` 制約は主に不整合防止用の最終防衛ライン
- 3.3 の `profiles` 閲覧制限により、ブロックした時点でその相手の
  `/mentors/[id]` や `/users/[id]` は次回以降「見つかりません」表示になる
  （ブロック済みの相手のページを再訪して重複してブロックする経路は存在しない）。
  唯一の重複挿入の可能性は、同じページでブロックボタンを連打した場合の競合だけで、
  その場合は `blocks` の主キー制約違反によりエラーになる。Server Action 側では
  これを一意制約違反として検出し、「ブロック済みです」というメッセージに
  変換して返す（ユーザーには失敗として見せない）
- 通報・ブロックの Server Action が失敗した場合は、既存の `ActionResult` 型
  （`lib/actions/types.ts`）を使ってエラーメッセージを返す

## 6. テスト方針

既存方針を踏襲する。

- マイグレーション（新規テーブル・関数・ポリシー変更）は、既存の
  `supabase/migrations/*.test.ts` と同じ静的文字列アサーションでテストする
- `is_blocked` を使う各ポリシー変更は、SQLの文字列に該当ロジックが
  含まれているかを確認するテストを書く（実DBに対する統合テストは行わない、
  このプロジェクトの既存方針と同じ）
- 通報理由ラベルの定数（`REPORT_REASON_LABELS`）など、純粋な変換ロジックが
  あればユニットテスト対象にする
- ブロック中一覧・通報一覧の `fetch*` 関数自体は、他の一覧取得関数
  （`fetchAllUsers` 等）と同様にユニットテスト対象外とする

## 7. 未解決事項・確認事項

なし（本設計はブレインストーミングでの合意事項をそのまま文書化したもの）。
