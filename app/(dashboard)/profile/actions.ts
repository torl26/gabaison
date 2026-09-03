'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { ok, err } from '@/lib/actions/types';
import { profileSchema } from '@/lib/validations/profile';
import { parseSkillsInput, parseTopicsInput } from '@/lib/profile/parse-list-input';

function optionalText(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? undefined : text;
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const experienceYearsRaw = optionalText(formData.get('experienceYears'));

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
    avatarUrl: formData.get('avatarUrl') || undefined,
    categoryKeys: formData.getAll('categoryKeys'),
    headline: formData.get('headline') ?? '',
    affiliation: formData.get('affiliation') ?? '',
    title: formData.get('title') ?? '',
    experienceYears: experienceYearsRaw === undefined ? null : Number(experienceYearsRaw),
    availability: formData.get('availability') ?? '',
    accepting: formData.get('accepting') === 'on',
    skills: parseSkillsInput(String(formData.get('skills') ?? '')),
    topics: parseTopicsInput(String(formData.get('topics') ?? '')),
    githubUrl: optionalText(formData.get('githubUrl')),
    xUrl: optionalText(formData.get('xUrl')),
    websiteUrl: optionalText(formData.get('websiteUrl')),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const {
    name,
    bio,
    avatarUrl,
    categoryKeys,
    headline,
    affiliation,
    title,
    experienceYears,
    availability,
    accepting,
    skills,
    topics,
    githubUrl,
    xUrl,
    websiteUrl,
  } = parsed.data;
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      name,
      bio,
      avatar_url: avatarUrl ?? null,
      headline,
      affiliation,
      title,
      experience_years: experienceYears,
      availability,
      accepting,
      skills,
      topics,
      github_url: githubUrl ?? null,
      x_url: xUrl ?? null,
      website_url: websiteUrl ?? null,
    })
    .eq('id', user.id);

  if (updateError) {
    return err('保存に失敗しました: ' + updateError.message);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'mentor') {
    await supabase.from('mentor_categories').delete().eq('mentor_id', user.id);

    if (categoryKeys && categoryKeys.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, key')
        .in('key', categoryKeys);

      if (categories && categories.length > 0) {
        const rows = categories.map((c) => ({
          mentor_id: user.id,
          category_id: c.id,
        }));
        const { error: insertError } = await supabase.from('mentor_categories').insert(rows);
        if (insertError) {
          return err('カテゴリの保存に失敗しました: ' + insertError.message);
        }
      }
    }
  }

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return ok(undefined);
}