# バッジ機能 設計書

- 作成日: 2026-09-04

## 1. 目的・背景

学生のモチベーション向上のため、プロフィール上に実績として表示する「バッジ」機能を
追加する。バッジには2系統ある。

1. イベント参加バッジ: 管理者が自由な名前で作成し、任意のユーザーに手動で付与する
2. マッチング回数バッジ: マッチング成立数の節目（1・5・10件）で自動付与する

現状ホーム画面のイベント表示（`DUMMY_EVENTS`）はダミーデータのみで、実際のイベント
参加登録・出席管理の仕組みは存在しない。今回はそこまでは作らず、「管理者が手動で
バッジを付与できる」ところまでを実装する。

## 2. スコープ

### 含む

1. バッジのカタログ（`badge_definitions`）と付与記録（`user_badges`）の2テーブル
2. マッチング成立数（本人が学生・メンターいずれかとして関与した `accepted` の
   累計件数）が 1・5・10 件に達した時点での自動付与
3. 管理者がイベント系バッジを自由な名前・アイコンで作成する画面（`/admin/badges`）
4. 管理者が特定ユーザーにイベント系バッジを手動付与する導線
   （`/admin/users/[id]` に追加）
5. 自分のプロフィール（`/profile`）・他人のプロフィール（`/users/[id]`）両方への
   バッジ一覧表示

### 含まない（将来の拡張候補）

- 実際のイベント参加登録・出席管理の仕組み（イベントテーブル、参加申込みなど）
- バッジの取り消し・編集（付与は immutable な記録として扱う）
- マッチング回数バッジの学生側/メンター側の個別カウント
  （今回は役割を問わず本人が関与した accepted 合計で判定する）
- バッジ獲得時の通知
- `/mentors/[id]`（メンター一覧からの詳細）へのバッジ表示
  （`/users/[id]` と実装は近いが今回は明示的にスコープ外とし、必要になれば追加する）

## 3. データベース設計

### 3.1 `badge_definitions` テーブル（バッジカタログ）

```sql
create table public.badge_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  icon text not null,
  source text not null check (source in ('manual', 'match_count')),
  threshold int,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint badge_definitions_threshold_only_for_match_count check (
    (source = 'match_count' and threshold is not null)
    or (source = 'manual' and threshold is null)
  )
);

alter table public.badge_definitions enable row level security;

create policy "badge_definitions_select_authenticated" on public.badge_definitions
  for select to authenticated using (true);

create policy "badge_definitions_insert_admin" on public.badge_definitions
  for insert to authenticated
  with check (
    (select public.is_admin())
    and source = 'manual'
    and created_by = (select auth.uid())
  );
```

`source = 'match_count'` の行はアプリの通常経路からは作れず（`insert` ポリシーが
`source = 'manual'` のみ許可）、本マイグレーションで直接シードする:

```sql
insert into public.badge_definitions (slug, label, icon, source, threshold) values
  ('match_count_1', '初マッチング達成', '🎯', 'match_count', 1),
  ('match_count_5', 'マッチング5件達成', '🔥', 'match_count', 5),
  ('match_count_10', 'マッチング10件達成', '🏆', 'match_count', 10);
```

update/delete ポリシーは作らない（バッジ種別の編集・削除は今回のスコープ外。
必要になれば別マイグレーションで対応する）。

### 3.2 `user_badges` テーブル（付与記録）

```sql
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_definition_id uuid not null references public.badge_definitions(id) on delete cascade,
  awarded_by uuid references public.profiles(id),
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_definition_id)
);

alter table public.user_badges enable row level security;

create policy "user_badges_select_authenticated" on public.user_badges
  for select to authenticated using (true);

create policy "user_badges_insert_admin" on public.user_badges
  for insert to authenticated
  with check (
    (select public.is_admin())
    and awarded_by = (select auth.uid())
    and badge_definition_id in (
      select id from public.badge_definitions where source = 'manual'
    )
  );
```

`select` を `reports`/`blocks` と異なり全認証ユーザーに開放するのは、
`profiles_select_authenticated`（`using (true)`）と同じ理由で、他人のプロフィール上に
バッジを表示する要件があるため。

`insert` ポリシーは `badge_definition_id` が `manual` 系であることを強制する
（`match_count` 系バッジを管理者が手動でも付与できてしまうと、自動付与ロジックと
二重に付与経路ができてしまうため）。`match_count` 系の付与は後述のトリガー関数
（`SECURITY DEFINER`）のみが行う。

update/delete ポリシーは作らない。

### 3.3 マッチング回数バッジの自動付与

```sql
create or replace function public.award_match_count_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.match_requests
  where status = 'accepted'
    and (student_id = p_user_id or mentor_id = p_user_id);

  insert into public.user_badges (user_id, badge_definition_id)
  select p_user_id, bd.id
  from public.badge_definitions bd
  where bd.source = 'match_count' and bd.threshold <= v_count
  on conflict (user_id, badge_definition_id) do nothing;
end;
$$;

create or replace function public.award_match_count_badges_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_match_count_badges(new.student_id);
  perform public.award_match_count_badges(new.mentor_id);
  return new;
end;
$$;

create trigger match_requests_award_badges
  after update of status on public.match_requests
  for each row
  when (new.status = 'accepted' and old.status is distinct from 'accepted')
  execute function public.award_match_count_badges_on_accept();
```

`match_requests` の既存トリガー（`enforce_match_request_update`）により、一度
`accepted` になった行がそこから別ステータスへ戻ることはない（`student` は
`pending` からしか `cancelled` にできず、`mentor` は `accepted`/`rejected` にしか
変更できない）。そのため「`accepted` への遷移時にその時点の累計件数で判定する」
だけで十分であり、キャンセル時に取り消す処理は不要。

`award_match_count_badges` は独立した関数として切り出し、将来 admin 画面から
「特定ユーザーの再集計」を手動実行したくなった場合にも呼び出せるようにしておく
（今回はトリガーからの呼び出しのみ使用）。

## 4. 画面構成

### 4.1 管理者: バッジ作成（新規 `/admin/badges`）

`app/admin/layout.tsx` の `ADMIN_NAV_ITEMS` に「バッジ管理」を追加する。

- 既存の `manual` バッジ一覧をアイコン・ラベルで表示（`app/admin/reports/page.tsx`
  と同じリスト調の見た目）
- 新規作成フォーム（ラベル・アイコン(絵文字)の2項目のみ）。`slug` はユーザー入力
  項目にはせず、Server Action側でラベルから機械的に生成する
  （例: ラベルの UUID 先頭8桁を付与した `badge-<uuid8>` 形式にし、日本語ラベルの
  スラッグ化を避ける。表示に使わない内部キーのため衝突回避を優先する）。
  Server Action（`createBadgeDefinitionAction`）で `badge_definitions` に insert する

### 4.2 管理者: ユーザーへのバッジ付与（`/admin/users/[id]` に追加）

既存のユーザー詳細ページに「バッジ」セクションを追加する。

- そのユーザーが既に持っているバッジ一覧（アイコン＋ラベル）
- `manual` バッジ一覧から選んで付与する `<select>` + 送信ボタン
  （`ReportButton` と同じ `useActionState` パターンの Server Action、
  `awardBadgeAction(userId, badgeDefinitionId)`）
- 既に付与済みのバッジは選択肢から除外する（`unique` 制約による insert 失敗を
  避けるため、UI側で事前にフィルタする）

### 4.3 プロフィール画面へのバッジ表示

`profile/page.tsx`（自分）・`users/[id]/page.tsx`（他人）の両方で、既存の
`fetchUserProfile` 呼び出しと並行して `fetchUserBadges(supabase, id)` を呼び、
ヘッダー部分（名前・ロールラベル・`AcceptingBadge` が並ぶ箇所）の下に、
バッジをアイコン＋ラベルの小さなピルとして横並びで表示する
（`profile-details.tsx` に新規コンポーネント `BadgeList` を追加し、両画面から
共有する — `AcceptingBadge` 等と同じファイルに置く）。バッジが0件の場合は
何も表示しない。

## 5. エラー処理

- バッジ付与フォームは管理者専用画面にのみ存在するため、権限チェックは
  `requireAdmin()`（ページレベル）と RLS の `insert` ポリシー（DBレベル）の
  二重で行う（既存の admin 機能と同じ方針）
- 同じバッジを二重付与しようとした場合（UI側フィルタをすり抜けた競合など）は
  `unique (user_id, badge_definition_id)` 制約違反になる。Server Action 側で
  これを検出し「既に付与済みです」というメッセージに変換して返す
  （`report-actions.ts` の重複エラー処理と同じ考え方）
- Server Action の戻り値は既存の `ActionResult`（`lib/actions/types.ts`）を使う

## 6. テスト方針

既存方針を踏襲する。

- 新規マイグレーション（テーブル・トリガー・ポリシー）は既存の
  `supabase/migrations/*.test.ts` と同じ静的文字列アサーションでテストする
- Server Action（`createBadgeDefinitionAction`, `awardBadgeAction`)は
  `report-actions.test.ts` と同様にユニットテスト対象とする
- `fetchUserBadges` などの単純な一覧取得関数はユニットテスト対象外とする
  （他の `fetch*` 関数と同じ扱い）

## 7. 未解決事項・確認事項

なし（本設計はブレインストーミングでの合意事項をそのまま文書化したもの）。
