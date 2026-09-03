# TechTies 紹介サイト

既存のTechTiesアプリへ接続する公開ランディングサイトです。

## 開発

```bash
pnpm install
pnpm dev
```

## アプリ接続先

本番アプリURLは `VITE_APP_BASE_URL` で設定できます。未設定時は同一ドメインの相対パスへ遷移します。

- `/signup?role=student`
- `/signup?role=mentor`
- `/login`
