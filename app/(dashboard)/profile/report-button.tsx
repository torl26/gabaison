'use client';

import { useActionState, useState } from 'react';
import { reportUserAction } from './report-actions';
import { REPORT_REASON_KEYS, REPORT_REASON_LABELS } from '@/lib/constants/report-reasons';

export function ReportButton({ reportedId }: { reportedId: string }) {
  const [state, formAction, pending] = useActionState(reportUserAction, null);
  const [open, setOpen] = useState(false);

  if (state?.success) {
    return <p className="text-xs text-muted">通報しました</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-red-400 hover:text-red-500"
      >
        通報する
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="reportedId" value={reportedId} />
      <select
        name="reason"
        required
        defaultValue=""
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
      >
        <option value="" disabled>
          理由を選択
        </option>
        {REPORT_REASON_KEYS.map((key) => (
          <option key={key} value={key}>
            {REPORT_REASON_LABELS[key]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '送信中...' : '送信'}
      </button>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
