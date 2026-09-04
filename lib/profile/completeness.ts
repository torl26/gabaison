import type { UserProfileView } from './get-user-profile';

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

export interface ProfileCompleteness {
  percent: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
}

/**
 * Name is excluded on purpose: signup already requires it, so counting it would
 * make every brand-new profile look partly complete without the user doing
 * anything.
 */
export function calculateCompleteness(profile: UserProfileView): ProfileCompleteness {
  const items: CompletenessItem[] = [
    { key: 'avatar', label: 'アイコン画像', done: Boolean(profile.avatarUrl) },
    { key: 'headline', label: 'ひとこと', done: profile.headline.trim() !== '' },
    { key: 'bio', label: '自己紹介', done: profile.bio.trim() !== '' },
    {
      key: 'affiliation',
      label: profile.role === 'mentor' ? '会社・組織' : '学校名',
      done: profile.affiliation.trim() !== '',
    },
    {
      key: 'title',
      label: profile.role === 'mentor' ? '職種' : '学年・専攻',
      done: profile.title.trim() !== '',
    },
    { key: 'skills', label: 'スキルタグ', done: profile.skills.length > 0 },
    {
      key: 'topics',
      label: profile.role === 'mentor' ? '相談できること' : '使用できる技術',
      done: profile.topics.length > 0,
    },
    { key: 'availability', label: '対応可能な時間帯', done: profile.availability.trim() !== '' },
    { key: 'links', label: 'リンク', done: profile.links.length > 0 },
  ];

  if (profile.role === 'mentor') {
    items.push(
      { key: 'categories', label: '対応カテゴリ', done: profile.categories.length > 0 },
      { key: 'experienceYears', label: '経験年数', done: profile.experienceYears !== null }
    );
  }

  const doneCount = items.filter((item) => item.done).length;

  return {
    percent: Math.round((doneCount / items.length) * 100),
    items,
    missing: items.filter((item) => !item.done),
  };
}
