import type { UserProfileView } from '@/lib/profile/get-user-profile';
import type { MentorStats } from '@/lib/profile/get-profile-stats';
import { formatResponseTime } from '@/lib/profile/get-profile-stats';

export function SkillTags({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-foreground"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export function AcceptingBadge({ accepting }: { accepting: boolean }) {
  return accepting ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
      申請受付中
    </span>
  ) : (
    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">現在停止中</span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface px-3 py-2">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export function MentorStatsRow({ stats }: { stats: MentorStats }) {
  const responseTime = formatResponseTime(stats.averageResponseHours);

  if (stats.acceptedCount === 0 && stats.respondedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Stat label="マッチング成立" value={`${stats.acceptedCount}件`} />
      {stats.responseRate !== null && (
        <Stat label="返信率" value={`${stats.responseRate}%`} />
      )}
      {responseTime && <Stat label="平均返信時間" value={responseTime} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-muted">{label}</span>
      {children}
    </div>
  );
}

export function ProfileDetails({ profile }: { profile: UserProfileView }) {
  const isMentor = profile.role === 'mentor';
  const affiliationLine = [
    profile.affiliation,
    profile.title,
    isMentor && profile.experienceYears !== null ? `経験${profile.experienceYears}年` : '',
  ]
    .filter(Boolean)
    .join(' ・ ');

  return (
    <div className="flex flex-col gap-4">
      {affiliationLine && (
        <Field label={isMentor ? '経歴' : '学校'}>
          <p className="text-sm text-foreground">{affiliationLine}</p>
        </Field>
      )}

      {profile.bio && (
        <Field label="自己紹介">
          <p className="whitespace-pre-line text-sm text-foreground">{profile.bio}</p>
        </Field>
      )}

      {profile.topics.length > 0 && (
        <Field label="相談できること">
          <ul className="flex flex-col gap-1">
            {profile.topics.map((topic) => (
              <li key={topic} className="flex gap-2 text-sm text-foreground">
                <span aria-hidden="true" className="text-primary">
                  ・
                </span>
                {topic}
              </li>
            ))}
          </ul>
        </Field>
      )}

      {profile.skills.length > 0 && (
        <Field label="スキル">
          <SkillTags skills={profile.skills} />
        </Field>
      )}

      {profile.categories.length > 0 && (
        <Field label="対応カテゴリ">
          <div className="flex flex-wrap gap-1">
            {profile.categories.map((category) => (
              <span
                key={category.key}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {category.label}
              </span>
            ))}
          </div>
        </Field>
      )}

      {profile.availability && (
        <Field label="対応可能な時間帯">
          <p className="text-sm text-foreground">{profile.availability}</p>
        </Field>
      )}

      {profile.links.length > 0 && (
        <Field label="リンク">
          <div className="flex flex-wrap gap-3">
            {profile.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
