import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile, Category } from '@/types/database';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) {
    return <p>プロフィールが見つかりませんでした。</p>;
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .returns<Category[]>();

  const { data: mentorCategories } = await supabase
    .from('mentor_categories')
    .select('category_id')
    .eq('mentor_id', user.id);

  const selectedCategoryIds = (mentorCategories ?? []).map((mc) => mc.category_id);
  const selectedCategoryKeys = (categories ?? [])
    .filter((c) => selectedCategoryIds.includes(c.id))
    .map((c) => c.key);

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">プロフィール</h1>
      <ProfileForm
        profile={profile}
        categories={categories ?? []}
        selectedCategoryKeys={selectedCategoryKeys}
      />
    </div>
  );
}