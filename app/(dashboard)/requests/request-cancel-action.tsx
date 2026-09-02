'use client';

import { useActionState } from 'react';
import { cancelMatchRequestAction } from './actions';

type Props = {
    requestId: string;
};

export function RequestCancelAction({ requestId }: Props) {
    const [state, formAction, pending] = useActionState(cancelMatchRequestAction, null);

    return (
        <div className="flex flex-col gap-2">
            <form
                action={formAction}
                onSubmit={(event) => {
                    if (!window.confirm('この申請を取り消しますか？取り消すと元に戻せません。')) {
                        event.preventDefault();
                    }
                }}
            >
                <input type="hidden" name="requestId" value={requestId} />
                <button
                    type="submit"
                    disabled={pending}
                    className="rounded border px-3 py-1 text-sm text-red-600 disabled:opacity-50"
                >
                    取り消す
                </button>
            </form>
            {state && !state.success && (
                <p className="text-sm text-red-600">{state.error}</p>
            )}
        </div>
    );
}