# TechTies

**TechTies** は、学生とメンターをつなぎ、ひとりで抱え込まずに次の一歩を考えるためのマッチングアプリです。学生は相談したいテーマに合うメンターを探し、メンターは自分の経験を必要としている学生とつながれます。

## プロダクトの特徴

- 学生・メンターの役割を選べるアカウント登録
- カテゴリからメンターを探せる検索画面
- メンターのプロフィール、経験、対応カテゴリの確認
- 相談メッセージ付きのマッチング申請
- 申請の承認・拒否・キャンセル・完了管理
- マッチング成立後のリアルタイムチャット
- プロフィール編集、アバター画像、プロフィール完成度の表示
- 完了したマッチングへのレビュー
- ユーザーのブロック・通報機能
- イベント参加・マッチング回数達成に応じたバッジ表示（マッチング回数バッジは自動付与）
- 管理者向けの利用状況集計・通報確認・バッジ作成/付与画面

## 画面一覧

| 画面 | URL | 内容 |
|---|---|---|
| 紹介ページ | `/` | TechTiesのコンセプト紹介。未ログイン時の入口 |
| ログイン | `/login` | メールアドレスとパスワードでログイン |
| 新規登録 | `/signup` | 学生またはメンターとして登録 |
| ホーム | `/home` | お知らせ、主要導線、イベント情報 |
| メンター検索 | `/mentors` | カテゴリ別のメンター検索 |
| メンター詳細 | `/mentors/[id]` | プロフィール確認とマッチング申請 |
| 申請一覧 | `/requests` | 送受信したマッチング申請の管理 |
| チャット一覧 | `/chat` | 承認済みマッチングの一覧 |
| チャットルーム | `/chat/[matchId]` | マッチング相手とのメッセージ交換 |
| プロフィール | `/profile` | 自分のプロフィールと完成度の確認 |
| プロフィール編集 | `/profile/edit` | プロフィール情報の編集 |
| ブロック一覧 | `/profile/blocked` | ブロック中ユーザーの管理 |
| ユーザー詳細 | `/users/[id]` | 他ユーザーの公開プロフィール |
| 管理者画面 | `/admin` | 利用状況の集計 |
| 通報管理 | `/admin/reports` | 通報内容の確認 |
| ユーザー管理 | `/admin/users` | ユーザー情報の確認、バッジの付与 |
| バッジ管理 | `/admin/badges` | バッジの作成（画像アップロード） |

## 技術スタック

- **Next.js 16** / App Router
- **React 19** / TypeScript
- **Tailwind CSS 4**
- **Supabase**（Authentication、Postgres、Storage、Realtime）
- **Zod**（入力バリデーション）
- **Vitest**（テスト）
- **Vercel**（デプロイ想定）

認証・データ操作は、Next.jsのServer ComponentsとServer Actionsを中心に実装しています。データベースのアクセス制御にはSupabaseのRLS（Row Level Security）を使用しています。

## セットアップ

### 必要な環境

- Node.js 20以上
- npm
- Supabaseプロジェクト

### インストール

```bash
git clone https://github.com/torl26/gabaison.git
cd gabaison
npm install
cp .env.local.example .env.local
```

`.env.local` にSupabaseの接続情報を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SKIP_AUTH=false
```

### データベースの準備

Supabase CLIを利用する場合は、マイグレーションを適用します。

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Supabase CLIを使わない場合は、`supabase/migrations/` 内のSQLをファイル名の時系列順にSupabase SQL Editorで実行してください。マイグレーションには、プロフィール自動作成、RLS、アバター画像、Realtime、レビュー、ブロック、通報、管理者権限、バッジ（テーブル・Storage・自動付与トリガー）などの設定が含まれています。

**注意:** `main`へのマージ・pushはVercelのビルド/デプロイを起動しますが、Supabaseのマイグレーションは自動では適用されません。新しいマイグレーションを追加したら、`main`にマージした後で必ず本番プロジェクトに対して`supabase db push`（または対応するSQLをSQL Editorで実行）してください。適用を忘れると、アプリのコードは新しいテーブル/Storageバケットを前提に動くのに実体が存在せず、機能がエラーになります。

適用状況は `supabase migration list`（要`supabase link`）で確認できます。Supabase Dashboard経由で直接SQLを実行した場合など、CLIの履歴テーブルとファイル名のタイムスタンプがずれることがあります。その場合は`supabase migration repair --status applied|reverted <timestamp>`で履歴を実体に合わせてから`supabase db push`を実行してください（履歴の付け替えのみで、SQLは再実行されません）。

### 開発サーバー

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 環境変数

| 変数 | 必須 | 説明 |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 必須 | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必須 | Supabaseの公開anon key |
| `SKIP_AUTH` | 任意 | 開発時のみ利用する認証スキップ設定。通常は`false` |

`SKIP_AUTH=true` の場合、実際のSupabaseセッションがないときに限り、UI確認用の固定ダミーユーザーが使われます。本番環境ではこの設定は無視され、実際の認証が使われます。RLSを含む実データの検証には、Supabaseで作成した実ユーザーを使用してください。

## コマンド

```bash
npm run dev       # 開発サーバーを起動
npm run build     # 本番ビルド
npm run start     # 本番ビルドを起動
npm run lint      # ESLint
npm test          # Vitestテスト
```

## メール確認の設定

開発中にサインアップを繰り返し確認する場合は、Supabase Dashboardの **Authentication → Sign In / Providers → Email** で **Confirm email** を一時的にOFFにすると確認しやすくなります。本番リリース前には、セキュリティとメールアドレスの所有確認のため、必ずONに戻してください。

新規ユーザーの`profiles`レコードは、`handle_new_user`トリガーによって`auth.users`への登録時に自動作成されます。

## 管理者機能

管理者画面では、学生数、メンター数、マッチング申請、メッセージ数などの集計を確認できます。また、通報内容とユーザー情報を確認できます。

管理者権限はアプリ画面から付与できません。必要な場合は、権限を付与する対象を確認したうえで、Supabase SQL Editorから設定してください。既存の権限変更用トリガーを無効化する必要がある構成のため、本番運用では作業者・対象ユーザー・実行時刻を記録し、作業後に必ずトリガーを有効化してください。

```sql
begin;
alter table public.profiles disable trigger profiles_prevent_role_change;
update public.profiles
set role = 'admin'
where id = '<対象のprofiles.id>';
alter table public.profiles enable trigger profiles_prevent_role_change;
commit;
```

管理者権限を持つアカウントは、集計画面だけでなく、通常のSupabaseクライアント経由で広い範囲のマッチング申請・メッセージ情報を読み取れる可能性があります。必要最小限のユーザーにのみ付与してください。

## ディレクトリ構成

```text
app/
  (auth)/              # ログイン・新規登録・認証Server Actions
  (dashboard)/         # ログイン後のホーム、検索、申請、チャット、プロフィール
  admin/               # 管理者画面
  intro/               # 紹介ページ関連のルート
  layout.tsx           # アプリ共通レイアウト・フォント
  globals.css          # 共通デザイントークン
lib/
  auth/                # 現在ユーザー・権限取得
  badges/              # バッジ取得・画像アップロード処理
  constants/           # カテゴリ、ロール、ステータスなどの定数
  profile/             # プロフィール取得・完成度・統計
  reviews/             # レビュー関連処理
  supabase/            # ブラウザ用・サーバー用Supabaseクライアント
  validations/         # Zodバリデーション
supabase/
  migrations/          # DBスキーマ、RLS、Storage、Realtime設定
  tests/               # DB関連テスト（構成に応じて配置）
types/
  database.ts          # データベース型定義
```

## 実装ルール

- ログイン中のユーザー取得には`getCurrentUser()`を使用する
- Server Actionsの入力は`lib/validations/`のZodスキーマで検証する
- Server Actionsの戻り値は`ok()`または`err()`を使う
- SupabaseのRLSポリシーを迂回するクライアント処理を追加しない
- 認証情報やサービスロールキーをクライアントコードに含めない
- 既存のマイグレーションを直接書き換えず、新しい変更は新規マイグレーションとして追加する

## デプロイ

VercelでGitHubリポジトリをImportし、Framework PresetにNext.jsを選択します。VercelのProject Settings → Environment Variablesに、少なくとも次の2つを登録してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

本番環境では`SKIP_AUTH=false`または未設定にし、SupabaseのAuthentication URL Configurationに本番URLを追加してください。デプロイ前に次のコマンドでビルドを確認します。

```bash
npm ci
npm run lint
npm test
npm run build
```

GitHubのPull Requestを作成すると、Vercel Previewで本番反映前の画面とビルド結果を確認できます。

**Vercelのデプロイはアプリのビルドのみで、Supabaseのマイグレーションは含まれません。** 新しいマイグレーションを含むマージをデプロイする際は、上記「データベースの準備」の通り`supabase db push`を別途実行してください。

## 設計資料

詳細な初期設計は、以下を参照してください。

- [メンター・マッチング設計書](docs/superpowers/specs/2026-08-26-mentor-matching-design.md)

## ライセンス

このリポジトリのライセンスは、プロジェクトの運用方針に従います。
