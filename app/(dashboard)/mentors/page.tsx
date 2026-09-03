import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from '@/lib/constants/categories';
import { fetchMentors } from './get-mentors';
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
  if (!user) {
    redirect('/login');
  }

  const { category } = await searchParams;
  const categoryFilter = isCategoryKey(category) ? category : undefined;

  const supabase = await createClient();
  const mentors = await fetchMentors(supabase, categoryFilter);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.05em] text-[#17263d]">メンターを探す</h1>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/mentors"
          className={`rounded-full border px-3 py-1 text-sm transition ${
            !categoryFilter
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground hover:bg-surface'
          }`}
        >
          すべて
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/mentors?category=${c.key}`}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              categoryFilter === c.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:bg-surface'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {mentors.length === 0 ? (
        <p className="text-sm text-muted">
          該当するメンターが見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {mentors.map((mentor) => (
            <li
              key={mentor.id}
              className="rounded-[1.4rem] border border-[#17263d]/10 bg-[#fffaf3] p-5 shadow-[0_18px_40px_-30px_rgba(23,38,61,0.5)]"
            >
              <div className="flex items-center gap-3">
                {mentor.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="font-bold text-foreground underline"
                  >
                    {mentor.name}
                  </Link>
                  <AcceptingBadge accepting={mentor.accepting} />
                </div>
              </div>

              {mentor.headline && (
                <p className="mt-2 text-sm font-bold text-foreground">{mentor.headline}</p>
              )}
              {[mentor.affiliation, mentor.title].filter(Boolean).length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {[mentor.affiliation, mentor.title].filter(Boolean).join(' ・ ')}
                </p>
              )}
              {[mentor.almaMater, mentor.almaMaterDepartment].filter(Boolean).length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  出身: {[mentor.almaMater, mentor.almaMaterDepartment].filter(Boolean).join(' ・ ')}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">{mentor.bio}</p>

              {mentor.skills.length > 0 && (
                <div className="mt-2">
                  <SkillTags skills={mentor.skills} />
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {mentor.categories.map((c) => (
                  <span
                    key={c.key}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
