# 学生-メンター マッチングアプリ

設計書: [docs/superpowers/specs/2026-08-26-mentor-matching-design.md](docs/superpowers/specs/2026-08-26-mentor-matching-design.md)

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase プロジェクトの URL / anon key を設定する
npm run dev
```

Supabaseプロジェクトを作成したら、`supabase/migrations/0001_init.sql` を
SupabaseのSQL Editor（または `supabase db push`）で適用してください。

## テスト

```bash
npm test          # Zodバリデーションスキーマの単体テスト（vitest）
npx tsc --noEmit   # 型チェック
npm run build      # ビルド確認
```

## ディレクトリ構成

- `lib/supabase/` — Supabaseクライアント（`client.ts`=ブラウザ用, `server.ts`=Server Components/Actions用）
- `lib/validations/` — Zodバリデーションスキーマ（Server Actionsの冒頭で使用）
- `lib/actions/types.ts` — Server Actionsの共通戻り値型 `ActionResult`
- `lib/constants/categories.ts` — 固定4カテゴリの定義
- `types/database.ts` — DBテーブルに対応する型
- `supabase/migrations/` — DBスキーマ・RLSポリシー

## 画面の分担

ログイン・新規登録・ログアウトは実装済みです（`app/(auth)/actions.ts`）。
残り5画面はNext.js App Routerのroute groupで骨組み（空のpage.tsx）だけが
用意されているので、担当が決まったらそのpage.tsxとそこから呼ぶ
Server Actionsを実装してください。

| 画面 | ルート | ファイル | 状態 |
|---|---|---|---|
| ログイン | `/login` | `app/(auth)/login/page.tsx` | 実装済み |
| 新規登録 | `/signup` | `app/(auth)/signup/page.tsx` | 実装済み |
| プロフィール | `/profile` | `app/(dashboard)/profile/page.tsx` | 未着手 |
| メンター検索 | `/mentors` | `app/(dashboard)/mentors/page.tsx` | 未着手 |
| メンター詳細・申請 | `/mentors/[id]` | `app/(dashboard)/mentors/[id]/page.tsx` | 未着手 |
| マッチング申請一覧・承認 | `/requests` | `app/(dashboard)/requests/page.tsx` | 未着手 |
| チャット | `/chat/[matchId]` | `app/(dashboard)/chat/[matchId]/page.tsx` | 未着手 |

Server Actionsは各画面のファイル内（または同じディレクトリの `actions.ts`、
`app/(auth)/actions.ts` が実例）に追加し、`lib/validations/` のスキーマで
検証したうえで `lib/actions/types.ts` の `ok()` / `err()` を使って結果を
返してください。ログイン中のユーザーは `supabase.auth.getUser()` を直接
呼ぶ代わりに `lib/auth/get-current-user.ts` の `getCurrentUser()` を使って
取得してください。

**注意:** Supabaseプロジェクトが未作成のため、認証フローはコード上は
完成していますが実際にサインアップ/ログインしての動作確認はまだ
できていません。プロジェクトを作成して `.env.local` を設定したら、
最初に動作確認をお願いします。

### 開発中にログインをスキップする

`.env.local` で `SKIP_AUTH=true` にすると、`getCurrentUser()` が
Supabaseを呼ばずに固定のダミーユーザーを返します（本番環境では
無視され、常に実際のSupabase認証を使います）。ログイン状態を前提と
した画面のUIを作るだけならこれで十分ですが、`profiles` などの
テーブルはRLSで `auth.uid()` を見ているため、実際のDB読み書きを
検証するには本物のSupabaseログインが必要です。
