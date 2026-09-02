import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  const skipAuthEnabled =
    process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-bold text-foreground">ログイン</h1>
      <LoginForm skipAuthEnabled={skipAuthEnabled} />
      <p className="text-sm text-muted">
        アカウントをお持ちでない方は{' '}
        <Link href="/signup" className="text-primary underline">
          新規登録
        </Link>
      </p>
    </main>
  );
}
