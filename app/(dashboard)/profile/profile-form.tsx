'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from './actions';
import { createClient } from '@/lib/supabase/client';
import { validateAvatarFile, buildAvatarStoragePath } from './avatar-upload';
import type { Profile, Category } from '@/types/database';

type Props = {
  profile: Profile;
  categories: Category[];
  selectedCategoryKeys: string[];
};

export function ProfileForm({ profile, categories, selectedCategoryKeys }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarError(null);
    setUploading(true);

    const supabase = createClient();
    const path = buildAvatarStoragePath(profile.id, file.type);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (uploadError) {
      setAvatarError('アップロードに失敗しました: ' + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set('avatarUrl', avatarUrl);
    const result = await updateProfile(formData);
    if (result && !result.success) {
      setError(result.error);
    } else {
      router.push('/profile');
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">名前</span>
        <input
          type="text"
          name="name"
          defaultValue={profile.name}
          required
          className="rounded-lg border border-border bg-surface p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">自己紹介</span>
        <textarea
          name="bio"
          defaultValue={profile.bio}
          rows={4}
          className="rounded-lg border border-border bg-surface p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">アイコン画像</span>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleAvatarChange}
          className="text-sm text-muted"
        />
        {uploading && <span className="text-sm text-muted">アップロード中...</span>}
        {avatarError && <p className="text-red-500 text-sm">{avatarError}</p>}
      </label>

      {profile.role === 'mentor' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted">対応カテゴリ</legend>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                name="categoryKeys"
                value={category.key}
                defaultChecked={selectedCategoryKeys.includes(category.key)}
                className="accent-primary"
              />
              {category.label}
            </label>
          ))}
        </fieldset>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="rounded-lg bg-primary p-2 text-primary-foreground transition hover:opacity-90"
      >
        保存
      </button>
    </form>
  );
}