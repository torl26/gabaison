import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from '@/lib/constants/categories';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { fetchMentors, fetchStudents } from './get-mentors';
import { AcceptingBadge, SkillTags } from '../profile/profile-details';

function isCategoryKey(value: string | undefined): value is CategoryKey {
  return CATEGORY_KEYS.includes(value as CategoryKey);
}

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const { category } = await searchParams;
  const isMentor = currentProfile?.role === 'mentor';
  const categoryFilter = !isMentor && isCategoryKey(category) ? category : undefined;
  const people = isMentor
    ? await fetchStudents(supabase)
    : await fetchMentors(supabase, categoryFilter);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c85f41]">{isMentor ? 'Find your next tie' : 'Find your mentor'}</p>
        <h1 className="text-2xl font-extrabold tracking-[-0.05em] text-[#17263d] sm:text-3xl">{isMentor ? '学生を探す' : 'メンターを探す'}</h1>
        <p className="mt-3 text-sm leading-6 text-[#17263d]/55">{isMentor ? '相談したいテーマを持つ学生とつながりましょう。' : '今のあなたに合うメンターを探してみましょう。'}</p>
      </div>

      {!isMentor && <nav className="flex flex-wrap gap-2"> <Link href="/mentors" className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${!categoryFilter ? 'border-[#e16f4d] bg-[#e16f4d] text-[#fff8ed]' : 'border-[#17263d]/12 bg-[#fffaf3] text-[#17263d]/65 hover:border-[#e16f4d]/50'}`}>すべて</Link>{CATEGORIES.map((c) => <Link key={c.key} href={`/mentors?category=${c.key}`} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${categoryFilter === c.key ? 'border-[#e16f4d] bg-[#e16f4d] text-[#fff8ed]' : 'border-[#17263d]/12 bg-[#fffaf3] text-[#17263d]/65 hover:border-[#e16f4d]/50'}`}>{c.label}</Link>)}</nav>}

      {people.length === 0 ? <p className="rounded-[1.4rem] bg-[#fffaf3] p-6 text-sm text-[#17263d]/55">{isMentor ? '現在、表示できる学生がいません。' : '該当するメンターが見つかりませんでした。'}</p> : <ul className="grid gap-4 lg:grid-cols-2">{people.map((person) => <li key={person.id} className="rounded-[1.4rem] border border-[#17263d]/10 bg-[#fffaf3] p-5 shadow-[0_18px_40px_-30px_rgba(23,38,61,0.5)] transition hover:-translate-y-0.5 hover:border-[#e16f4d]/40"><div className="flex items-start gap-3">{person.avatarUrl && <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-2xl border border-[#17263d]/10 object-cover" /> }<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={isMentor ? `/users/${person.id}` : `/mentors/${person.id}`} className="font-extrabold text-[#17263d] underline decoration-[#c85f41]/25 underline-offset-4">{person.name}</Link><span className="rounded-full bg-[#f5c45b]/25 px-2 py-0.5 text-xs font-bold text-[#9b6f16]">{ROLE_LABELS[person.role]}</span>{!isMentor && <AcceptingBadge accepting={person.accepting} />}</div>{person.headline && <p className="mt-2 text-sm font-bold text-[#17263d]">{person.headline}</p>}</div></div>{[person.affiliation, person.title].filter(Boolean).length > 0 && <p className="mt-3 text-xs text-[#17263d]/50">{[person.affiliation, person.title].filter(Boolean).join(' ・ ')}</p>}{[person.almaMater, person.almaMaterDepartment].filter(Boolean).length > 0 && <p className="mt-1 text-xs text-[#17263d]/50">出身: {[person.almaMater, person.almaMaterDepartment].filter(Boolean).join(' ・ ')}</p>}<p className="mt-2 line-clamp-3 text-sm leading-6 text-[#17263d]/55">{person.bio}</p>{person.skills.length > 0 && <div className="mt-3"><SkillTags skills={person.skills} /></div>}{person.categories.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{person.categories.map((c) => <span key={c.key} className="rounded-full bg-[#e16f4d]/10 px-2 py-0.5 text-xs font-semibold text-[#c85f41]">{c.label}</span>)}</div>}</li>)}</ul>}
    </div>
  );
}
