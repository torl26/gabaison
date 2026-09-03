'use client';

import { useActionState, useState } from 'react';
import { submitReviewAction } from './actions';

const RATINGS = [1, 2, 3, 4, 5];

export function ReviewForm({
  requestId,
  mentorName,
}: {
  requestId: string;
  mentorName: string;
}) {
  const [state, formAction, pending] = useActionState(submitReviewAction, null);
  const [rating, setRating] = useState(5);

  if (state?.success) {
    return <p className="text-sm text-muted">レビューを投稿しました。ありがとうございます ✨</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl bg-background p-3">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">{mentorName}さんの相談はいかがでしたか？</span>
        <div className="flex gap-1">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value}点`}
              aria-pressed={rating === value}
              className={`text-2xl leading-none transition ${
                value <= rating ? 'text-amber-400' : 'text-border'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">コメント（任意）</span>
        <textarea
          name="comment"
          rows={3}
          maxLength={500}
          placeholder="どんなところが良かったか、これから相談する人の参考になることを書いてみましょう。"
          className="rounded-lg border border-border bg-surface p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      {state && !state.success && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '投稿中...' : 'レビューを投稿'}
      </button>
    </form>
  );
}
