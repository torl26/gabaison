'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from './actions';
import { createClient } from '@/lib/supabase/client';
import { validateAvatarFile, buildAvatarStoragePath } from './avatar-upload';
import {
  MAX_SKILLS,
  MAX_TOPICS,
  formatSkillsInput,
  formatTopicsInput,
} from '@/lib/profile/parse-list-input';
import type { Profile, Category } from '@/types/database';

type Props = {
  profile: Profile;
  categories: Category[];
  selectedCategoryKeys: string[];
};

const INPUT_CLASS =
  'rounded-lg border border-border bg-surface p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-4">
      <legend className="px-1 text-sm font-bold text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProfileForm({ profile, categories, selectedCategoryKeys }: Props) {
  const router = useRouter();
  const isMentor = profile.role === 'mentor';
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
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Section title="基本情報">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">名前</span>
          <input
            type="text"
            name="name"
            defaultValue={profile.name}
            required
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">ひとこと</span>
          <input
            type="text"
            name="headline"
            defaultValue={profile.headline}
            maxLength={60}
            placeholder={
              isMentor ? '例: 現役エンジニアがキャリア相談に乗ります' : '例: Web開発を勉強中の大学2年生です'
            }
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">一覧カードに表示される1行の紹介文です（60文字以内）</span>
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

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">自己紹介</span>
          <textarea name="bio" defaultValue={profile.bio} rows={4} className={INPUT_CLASS} />
        </label>
      </Section>

      <Section title={isMentor ? '経歴' : '学校'}>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">{isMentor ? '会社・組織' : '学校名'}</span>
          <input
            type="text"
            name="affiliation"
            defaultValue={profile.affiliation}
            maxLength={100}
            placeholder={isMentor ? '例: 株式会社サンプル' : '例: サンプル大学'}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">{isMentor ? '職種' : '学年・専攻'}</span>
          <input
            type="text"
            name="title"
            defaultValue={profile.title}
            maxLength={50}
            placeholder={isMentor ? '例: バックエンドエンジニア' : '例: 情報工学科 2年'}
            className={INPUT_CLASS}
          />
        </label>

        {isMentor && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">経験年数</span>
            <input
              type="number"
              name="experienceYears"
              defaultValue={profile.experience_years ?? ''}
              min={0}
              max={80}
              className={INPUT_CLASS}
            />
          </label>
        )}

        {isMentor && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">出身校</span>
            <input
              type="text"
              name="almaMater"
              defaultValue={profile.alma_mater}
              maxLength={100}
              placeholder="例: サンプル大学"
              className={INPUT_CLASS}
            />
          </label>
        )}

        {isMentor && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">出身学部</span>
            <input
              type="text"
              name="almaMaterDepartment"
              defaultValue={profile.alma_mater_department}
              maxLength={50}
              placeholder="例: 工学部情報工学科"
              className={INPUT_CLASS}
            />
          </label>
        )}
      </Section>

      <Section title="相談できること">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">スキルタグ</span>
          <input
            type="text"
            name="skills"
            defaultValue={formatSkillsInput(profile.skills ?? [])}
            placeholder="例: React, TypeScript, 機械学習"
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">
            カンマ区切りで{MAX_SKILLS}個まで入力できます
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">相談できること</span>
          <textarea
            name="topics"
            defaultValue={formatTopicsInput(profile.topics ?? [])}
            rows={4}
            placeholder={'例:\nES添削\nポートフォリオレビュー\n技術選定の相談'}
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">1行に1件、{MAX_TOPICS}件まで入力できます</span>
        </label>

        {isMentor && (
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

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">対応可能な時間帯</span>
          <input
            type="text"
            name="availability"
            defaultValue={profile.availability}
            maxLength={100}
            placeholder="例: 平日夜・週末の午前中"
            className={INPUT_CLASS}
          />
        </label>

        {isMentor && (
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              name="accepting"
              defaultChecked={profile.accepting}
              className="accent-primary"
            />
            <span className="text-sm">新しい申請を受け付ける</span>
          </label>
        )}
      </Section>

      <Section title="リンク">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">GitHub</span>
          <input
            type="url"
            name="githubUrl"
            defaultValue={profile.github_url ?? ''}
            placeholder="https://github.com/..."
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">X</span>
          <input
            type="url"
            name="xUrl"
            defaultValue={profile.x_url ?? ''}
            placeholder="https://x.com/..."
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Webサイト・ポートフォリオ</span>
          <input
            type="url"
            name="websiteUrl"
            defaultValue={profile.website_url ?? ''}
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        </label>
      </Section>

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
