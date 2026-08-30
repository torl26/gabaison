import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <LoginForm />
    </div>
  );
}