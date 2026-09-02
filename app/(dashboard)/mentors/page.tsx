import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from '@/lib/constants/categories';
import { fetchMentors } from './get-mentors';

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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">メンターを探す</h1>

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
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <Link
                href={`/mentors/${mentor.id}`}
                className="font-bold text-foreground underline"
              >
                {mentor.name}
              </Link>
              <p className="mt-1 text-sm text-muted">{mentor.bio}</p>
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
