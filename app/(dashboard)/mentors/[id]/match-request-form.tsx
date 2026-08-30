'use client';

import { useActionState } from 'react';
import { requestMatchAction } from './actions';
import type { CategoryDefinition } from '@/lib/constants/categories';

type Props = {
  mentorId: string;
  categories: CategoryDefinition[];
};

export function MatchRequestForm({ mentorId, categories }: Props) {
  const [state, formAction, pending] = useActionState(requestMatchAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <input type="hidden" name="mentorId" value={mentorId} />

      <label className="flex flex-col gap-1 text-sm">
        カテゴリ
        <select name="categoryKey" required className="rounded border px-3 py-2">
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        メッセージ(任意)
        <textarea name="message" rows={4} className="rounded border px-3 py-2" />
      </label>

      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && state.success && (
        <p className="text-sm text-green-600">申請しました</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? '送信中...' : 'マッチングを申請する'}
      </button>
    </form>
  );
}
