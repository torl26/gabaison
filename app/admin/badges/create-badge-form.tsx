'use client';

import { useActionState, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateBadgeImageFile, buildBadgeImageStoragePath } from '@/lib/badges/badge-image-upload';
import { createBadgeDefinitionAction } from './badge-actions';

export function CreateBadgeForm() {
  const [state, formAction, pending] = useActionState(createBadgeDefinitionAction, null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Reset the form after a successful submission. Adjusting state during
  // render (rather than in a useEffect) avoids an extra render pass — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state?.success) {
      setImageUrl('');
      setFormKey((key) => key + 1);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateBadgeImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageError(null);
    setUploading(true);

    const supabase = createClient();
    const path = buildBadgeImageStoragePath(file.type);
    const { error: uploadError } = await supabase.storage
      .from('badge-icons')
      .upload(path, file);

    setUploading(false);

    if (uploadError) {
      setImageError('アップロードに失敗しました: ' + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('badge-icons').getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  return (
    <div className="flex flex-col gap-1">
      <form key={formKey} action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <label className="flex flex-col gap-1 text-xs text-muted">
          画像
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageChange}
            className="text-sm text-muted"
          />
          {uploading && <span className="text-xs text-muted">アップロード中...</span>}
          {imageError && <p className="text-xs text-red-600">{imageError}</p>}
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          ラベル
          <input
            name="label"
            required
            maxLength={50}
            placeholder="ハッカソン参加"
            className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={pending || uploading || !imageUrl}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '作成中...' : '作成する'}
        </button>
      </form>
      {state && !state.success && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">作成しました</p>}
    </div>
  );
}
