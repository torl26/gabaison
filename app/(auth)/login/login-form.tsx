'use client';

import { useState } from 'react';
import { login } from './actions';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result && !result.success) {
      setError(result.error ?? '不明なエラーが発生しました');
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <input
        type="email"
        name="email"
        placeholder="メールアドレス"
        required
        className="border p-2 rounded"
      />
      <input
        type="password"
        name="password"
        placeholder="パスワード"
        required
        className="border p-2 rounded"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white p-2 rounded">
        ログイン
      </button>
    </form>
  );
}