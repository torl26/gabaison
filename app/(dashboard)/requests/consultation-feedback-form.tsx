'use client';

import { useActionState, useState } from 'react';
import { submitConsultationFeedbackAction } from './actions';

const RATINGS = [1, 2, 3, 4, 5];

type Props = { requestId: string; role: 'student' | 'mentor'; counterpartName: string };

export function ConsultationFeedbackForm({ requestId, role, counterpartName }: Props) {
  const [state, formAction, pending] = useActionState(submitConsultationFeedbackAction, null);
  const [rating, setRating] = useState(5);
  const isStudent = role === 'student';

  if (state?.success) {
    return <p className="rounded-2xl bg-[#d8eadf] px-4 py-3 text-sm font-semibold leading-6 text-[#28543d]">アンケートを送信しました。ご協力ありがとうございます。</p>;
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4 rounded-[1.4rem] border border-[#17263d]/10 bg-[#fcf6eb] p-5">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#c85f41]">After the consultation</p>
        <h3 className="mt-1 text-lg font-extrabold text-[#17263d]">{isStudent ? '今回の相談を振り返る' : '学生との相談を振り返る'}</h3>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-[#17263d]/75">
        {isStudent ? '今回、何がわかったのか・何ができるようになったのか' : `${counterpartName}さんの印象や特徴`}
        <textarea name="reflection" rows={4} maxLength={500} required placeholder={isStudent ? '例：自分の強みが整理でき、次にやることが明確になりました。' : '例：質問が具体的で、学んだことを行動に移す力のある学生でした。'} className="rounded-2xl border border-[#17263d]/12 bg-white/75 px-4 py-3 text-sm font-normal leading-6 text-[#17263d] outline-none transition focus:border-[#e16f4d]/60 focus:bg-white focus:ring-4 focus:ring-[#e16f4d]/10" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold text-[#17263d]/75">{isStudent ? `${counterpartName}さんを5段階で評価` : '今回の相談を5段階で評価'}</legend>
        <div className="mt-2 flex gap-1">
          {RATINGS.map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value}点`} aria-pressed={rating === value} className={`text-3xl leading-none transition hover:scale-110 ${value <= rating ? 'text-[#e16f4d]' : 'text-[#17263d]/15'}`}>★</button>)}
        </div>
      </fieldset>
      {state && !state.success && <p role="alert" className="rounded-xl bg-[#e16f4d]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#a84c33]">{state.error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded-full bg-[#e16f4d] px-5 py-3 text-sm font-bold text-[#fff8ed] shadow-[0_14px_26px_-16px_rgba(196,85,54,0.9)] transition hover:-translate-y-0.5 hover:bg-[#cf5f40] disabled:opacity-60">{pending ? '送信中...' : 'アンケートを送信'}</button>
    </form>
  );
}
