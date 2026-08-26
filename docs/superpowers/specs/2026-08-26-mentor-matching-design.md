# 学生-メンター マッチングアプリ 設計書

- 作成日: 2026-08-26
- 開発期間: 2週間
- 技術スタック: Next.js (App Router) / Supabase (Auth, PostgreSQL, Realtime) / Vercel

## 1. 目的・背景

学生とメンターをつなぐマッチングアプリを構築する。サポート内容は単一目的に絞らず、
「キャリア相談」「スキル/技術メンタリング」「プロジェクト支援」「学業/研究支援」など
複数のカテゴリを用意し、学生がその都度必要なカテゴリを選んでメンターを探せるようにする。

## 2. スコープ

### MVP（必須・2週間で実装する）

1. ユーザー登録・ログイン（学生／メンター、メールアドレス＋パスワード）
2. プロフィール作成・編集（自己紹介、対応カテゴリなど）
3. メンター一覧検索・カテゴリ絞り込み
4. マッチング申請（学生→メンター）と承認／却下
5. アプリ内チャット（マッチング成立後）

### 余力があれば実装する（優先度順）

6. レビュー・評価機能（マッチング終了後の評価）
7. 日程調整・カレンダー連携
8. 管理者用ダッシュボード（ユーザー管理・通報対応など）

### スコープ外（今回は扱わない）

- ソーシャルログイン（Google等）
- メンターの審査・招待制（登録は誰でも自由に可能）
- 決済・有償メンタリング機能
- プッシュ通知（ネイティブアプリ相当の機能）

## 3. アーキテクチャ概要

Next.js（App Router, React Server Components）+ Server Actions + Supabase の構成を採用する。

- **フロントエンド/バックエンド**: Next.js App Router。ページ表示はServer Componentsで行い、
  データ更新（登録・申請・承認・メッセージ送信など）はServer Actionsで行う。独立したAPIレイヤー
  （REST API層やtRPCなど）は設けず、Server Actionsが実質的なバックエンドを兼ねる。
- **認証**: Supabase Auth（メールアドレス＋パスワード）。
- **データベース**: Supabase PostgreSQL。
- **リアルタイム通信**: Supabaseの Realtime機能（Postgres Changes）をチャット機能に利用する。
- **デプロイ**: Vercel（フロントエンド）＋ Supabase（バックエンド/DB）。

この構成を選んだ理由は、2週間という短い開発期間で、認証・DB・リアルタイム通信を
すべて1つのプラットフォーム（Supabase）に集約でき、APIレイヤーの実装コストを
最小化できるため。

### 検討した他の選択肢

- **Pages Router + 独自API Routes（REST風）**: 設計はイメージしやすいが、型の受け渡しや
  ボイラープレートがApp Router + Server Actions構成より多くなり、2週間には不向き。
- **App Router + tRPC等の型安全レイヤー**: 型安全性は高いが、セットアップ自体に工数がかかり、
  今回の規模ではオーバーエンジニアリング。

## 4. データモデル

### 4.1 テーブル一覧

#### `profiles`
Supabaseの `auth.users` と1:1で紐付くユーザープロフィール。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK, FK -> auth.users.id) | ユーザーID |
| role | text (`student` \| `mentor` \| `admin`) | ユーザー種別 |
| name | text | 表示名 |
| bio | text | 自己紹介文 |
| avatar_url | text (nullable) | アバター画像URL |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

#### `categories`
サポートカテゴリのマスタ（固定4種、初期データとして投入）。

| カラム | 型 | 説明 |
|---|---|---|
| id | serial (PK) | カテゴリID |
| key | text (unique) | `career` / `skill` / `project` / `academic` |
| label | text | 表示名（例: 「キャリア相談」） |

#### `mentor_categories`
メンターが対応可能なカテゴリ（多対多の中間テーブル）。

| カラム | 型 | 説明 |
|---|---|---|
| mentor_id | uuid (FK -> profiles.id) | メンターID |
| category_id | int (FK -> categories.id) | カテゴリID |

複合主キー: `(mentor_id, category_id)`

#### `match_requests`
学生からメンターへのマッチング申請。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 申請ID |
| student_id | uuid (FK -> profiles.id) | 申請した学生 |
| mentor_id | uuid (FK -> profiles.id) | 申請先メンター |
| category_id | int (FK -> categories.id) | 申請対象カテゴリ |
| status | text (`pending` \| `accepted` \| `rejected`) | 申請ステータス |
| message | text (nullable) | 申請時のメッセージ |
| created_at | timestamptz | 申請日時 |
| updated_at | timestamptz | ステータス更新日時 |

学生・メンターともに同時に複数の `match_requests` を進行可能（人数・件数の制限なし）。

#### `messages`
マッチング成立後のチャットメッセージ。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | メッセージID |
| match_id | uuid (FK -> match_requests.id) | 紐づくマッチング |
| sender_id | uuid (FK -> profiles.id) | 送信者 |
| content | text | メッセージ本文 |
| created_at | timestamptz | 送信日時 |

`messages` の送受信は `match_requests.status = 'accepted'` の場合のみ許可する。

### 4.2 ER概要（テキスト表現）

```
auth.users 1---1 profiles 1---N mentor_categories N---1 categories
profiles(student) 1---N match_requests N---1 profiles(mentor)
match_requests N---1 categories
match_requests 1---N messages
```

## 5. 主要フロー

### 5.1 登録・ログイン
1. トップページから「学生として登録」または「メンターとして登録」を選択。
2. メールアドレス・パスワードを入力してSupabase Authでサインアップ。
3. サインアップ完了時に `profiles` レコードを作成し、選択した `role` を設定する。
4. ログインは共通のメール＋パスワードフォームから行う。

### 5.2 プロフィール作成・編集
- 学生・メンター共通で `name` / `bio` / `avatar_url` を編集可能。
- メンターのみ、対応カテゴリ（`mentor_categories`）を選択できるUIを表示する。

### 5.3 メンター検索
- 学生はカテゴリ（career / skill / project / academic）で絞り込んだメンター一覧を閲覧する。
- 一覧には `name` / `bio` の抜粋 / 対応カテゴリタグを表示する。

### 5.4 マッチング申請・承認
1. 学生がメンター詳細ページからカテゴリを指定し、メッセージを添えて申請（`match_requests` に
   `status = 'pending'` で作成）。
2. メンターは自分宛の `pending` な申請一覧を確認し、承認（`accepted`）または却下
   （`rejected`）する。
3. 承認されると、そのマッチングに対応するチャットルームが有効化される。

### 5.5 チャット
- `accepted` 状態の `match_requests` ごとに1つのチャットルームを持つ。
- メッセージ送信はServer Action経由で `messages` にINSERTし、Supabase Realtime の
  Postgres Changes（`match_id` でフィルタ）をクライアントで購読してリアルタイムに反映する。

## 6. 権限管理（RLS方針）

Supabase Row Level Security を全テーブルで有効化し、以下の方針で制御する。

- `profiles`: 本人のみ自分の行をUPDATE可能。SELECTは認証済みユーザー全員に対して、
  検索・一覧表示に必要な範囲（`name` / `bio` / `role` / `avatar_url`）を許可する。
- `mentor_categories`: 本人（メンター）のみINSERT/DELETE可能。SELECTは認証済み全員可。
- `match_requests`: `student_id = auth.uid()` または `mentor_id = auth.uid()` の行のみ
  SELECT可能。INSERTは `student_id = auth.uid()` の場合のみ。UPDATE（承認/却下/終了）は
  当事者のみ。
- `messages`: 対応する `match_requests` の当事者（`student_id` または `mentor_id`）のみ
  SELECT可能。INSERTは対象の `match_requests.status = 'accepted'` の場合のみ許可する
  （DB関数またはRLSポリシー内のサブクエリで判定）。

RLSをアクセス制御の最終防衛ラインとし、Server Action側でも同等のチェックを行うことで
二重に保護する。

## 7. エラーハンドリング

- 入力値のバリデーションは Zod スキーマで行い、Server Actionsの冒頭で実行する。
- Server Actionsは `{ success: boolean; error?: string }` 形式の戻り値を統一フォーマットとし、
  失敗時はクライアント側でトースト通知を表示する。
- Supabaseからのエラー（RLS違反・制約違反など）は、ユーザー向けの一般的なメッセージに
  変換してから表示し、詳細なエラー内容はログにのみ出力する。

## 8. テスト方針

2週間という開発期間の制約上、以下の優先順位でテストを行う。

- **手動QA（優先）**: 主要フロー（登録→プロフィール作成→検索→申請→承認→チャット送受信）を
  学生役・メンター役の2アカウントで通しで確認する。
- **自動テスト（最小限）**: Zodバリデーションスキーマの単体テストのみ実装する。
- **スコープ外**: E2Eテスト（Playwright等）は今回のMVPでは実装しない。余力があれば
  次フェーズで検討する。

## 9. デプロイ

- ホスティング: Vercel（Next.jsアプリケーション）
- DB/認証/Realtime: Supabase（別プロジェクトとして用意）
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` をVercelの
  環境変数として設定する。管理者操作等でService Role Keyが必要な場合は、サーバー側
  （Server Actions内）でのみ使用し、クライアントに公開しない。

## 10. 未確定・今後の検討事項（余力実装分）

- レビュー・評価機能の詳細仕様（評価軸、公開範囲など）
- 日程調整・カレンダー連携の実装方式
- 管理者ダッシュボードで扱う操作範囲（凍結・通報対応など）

これらはMVPの実装完了後、進捗状況を見て着手するかを判断する。
