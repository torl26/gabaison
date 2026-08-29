'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import type { Profile, Category } from '@/types/database';

type Props = {
  profile: Profile;
  categories: Category[];
  selectedCategoryKeys: string[];
};

export function ProfileForm({ profile, categories, selectedCategoryKeys }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const result = await updateProfile(formData);
    if (result && !result.success) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">名前</span>
        <input
          type="text"
          name="name"
          defaultValue={profile.name}
          required
          className="border p-2 rounded"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">自己紹介</span>
        <textarea
          name="bio"
          defaultValue={profile.bio}
          rows={4}
          className="border p-2 rounded"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">アイコン画像URL</span>
        <input
          type="text"
          name="avatarUrl"
          defaultValue={profile.avatar_url ?? ''}
          placeholder="https://..."
          className="border p-2 rounded"
        />
      </label>

      {profile.role === 'mentor' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-gray-500">対応カテゴリ</legend>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="categoryKeys"
                value={category.key}
                defaultChecked={selectedCategoryKeys.includes(category.key)}
              />
              {category.label}
            </label>
          ))}
        </fieldset>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">保存しました</p>}

      <button type="submit" className="bg-black text-white p-2 rounded">
        保存
      </button>
    </form>
  );
}