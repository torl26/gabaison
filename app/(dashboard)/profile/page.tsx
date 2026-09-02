import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { redirect } from 'next/navigation';
import type { Profile, Category } from '@/types/database';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) {
    return <p className="text-muted">プロフィールが見つかりませんでした。</p>;
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
      <h1 className="text-2xl font-bold text-foreground">プロフィール</h1>
      <ProfileForm
        profile={profile}
        categories={categories ?? []}
        selectedCategoryKeys={selectedCategoryKeys}
      />
    </div>
  );
}