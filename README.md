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

各画面はNext.js App Routerのroute groupで既に骨組み（空のpage.tsx）が
用意されています。担当が決まったら、そのpage.tsxとそこから呼ぶ
Server Actionsを実装してください。

| 画面 | ルート | ファイル |
|---|---|---|
| ログイン | `/login` | `app/(auth)/login/page.tsx` |
| 新規登録 | `/signup` | `app/(auth)/signup/page.tsx` |
| プロフィール | `/profile` | `app/(dashboard)/profile/page.tsx` |
| メンター検索 | `/mentors` | `app/(dashboard)/mentors/page.tsx` |
| メンター詳細・申請 | `/mentors/[id]` | `app/(dashboard)/mentors/[id]/page.tsx` |
| マッチング申請一覧・承認 | `/requests` | `app/(dashboard)/requests/page.tsx` |
| チャット | `/chat/[matchId]` | `app/(dashboard)/chat/[matchId]/page.tsx` |

Server Actionsは各画面のファイル内（または同じディレクトリの `actions.ts`）に
追加し、`lib/validations/` のスキーマで検証したうえで
`lib/actions/types.ts` の `ok()` / `err()` を使って結果を返してください。
