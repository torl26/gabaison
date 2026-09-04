import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { fetchMatchRequests } from '../requests/get-requests';
import { fetchUserProfile } from '@/lib/profile/get-user-profile';
import { calculateCompleteness } from '@/lib/profile/completeness';

const DUMMY_EVENTS = [
  { icon: '🎤', date: '9/20(土) 19:00〜', title: 'オンライン交流会', description: '先輩メンターと気軽に話せるオンラインイベントです。' },
  { icon: '📚', date: '9/27(日) 14:00〜', title: '就活対策セミナー', description: 'ES添削と面接対策のポイントを現役メンターが解説します。' },
  { icon: '💻', date: '10/4(土)〜5(日)', title: 'ハッカソン参加者募集', description: 'チームを組んで短期間の開発に挑戦するイベントです。' },
];

const DUMMY_ADS = [
  { color: 'bg-[#d8eadf]', icon: '📈', sponsor: 'CareerNext', headline: '転職のプロがキャリア相談を無料サポート' },
  { color: 'bg-[#e7d8ed]', icon: '🗣️', sponsor: 'GlobalTalk', headline: 'オンライン英会話が今なら初月無料' },
];

const LINKS = [
  { href: '/mentors', icon: '⌕', eyebrow: 'Find your tie', title: 'メンターを探す', description: 'カテゴリから、自分に合うメンターを探せます。' },
  { href: '/requests', icon: '↗', eyebrow: 'Your requests', title: 'マッチング申請', description: '送った・受け取った申請を確認できます。' },
  { href: '/profile', icon: '○', eyebrow: 'Your profile', title: 'プロフィール', description: '名前や自己紹介、対応カテゴリを編集できます。' },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [profile, requests] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchMatchRequests(supabase, user.id),
  ]);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const displayName = profile?.name ?? 'あなた';
  const completenessPercent = profile ? calculateCompleteness(profile).percent : null;

  return (
    <div className="relative flex flex-1 flex-col gap-10 overflow-hidden bg-[#fcf6eb] text-[#17263d] -m-4 p-4 sm:-m-8 sm:p-8">
      <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-[#f5c45b]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -left-40 size-80 rounded-full bg-[#e16f4d]/10 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-[#17263d] p-7 text-[#fff8ed] shadow-[0_28px_55px_-32px_rgba(23,38,61,0.7)] sm:p-10 lg:flex-row lg:items-end">
          <div>
            <p className="mb-5 flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f5c45b]"><span className="h-px w-8 bg-[#f5c45b]" />Your next step</p>
            <h1 className="max-w-[13em] text-[clamp(2rem,4.5vw,3.6rem)] font-extrabold leading-[1.1] tracking-[-0.07em] [text-wrap:balance]"><span className="block whitespace-nowrap">おかえりなさい、</span><span className="block whitespace-nowrap text-[#f5c45b]">{displayName}さん。</span></h1>
            <p className="mt-5 text-sm leading-7 text-[#fff8ed]/60">今日も、できるところから。<br />話してみたいことをひとつ選んでみましょう。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-[#fff8ed]/70"><p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#f5c45b]">Today’s note</p><p className="mt-2 font-semibold text-[#fff8ed]">小さな相談が、次の一歩になる。</p></div>
        </div>
      </div>

      <section className="relative mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c85f41]">Choose your step</p><h2 className="text-2xl font-extrabold tracking-[-0.05em] sm:text-3xl">今、できること。</h2></div><span className="hidden text-xs font-semibold text-[#17263d]/40 sm:block">自分のペースで選べます</span></div>
        <ul className="grid gap-4 md:grid-cols-3">
          {LINKS.map((link) => <li key={link.href}><Link href={link.href} className="group flex min-h-[190px] flex-col justify-between rounded-[1.6rem] border border-[#17263d]/10 bg-[#fffaf3]/90 p-6 shadow-[0_18px_40px_-30px_rgba(23,38,61,0.5)] transition-all duration-200 hover:-translate-y-1 hover:border-[#e16f4d]/45 hover:shadow-[0_24px_45px_-28px_rgba(23,38,61,0.45)]"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#f5c45b]/35 text-2xl font-light text-[#c85f41]">{link.icon}</span>{link.href === '/requests' && pendingCount > 0 && <span className="rounded-full bg-[#f5c45b]/30 px-2.5 py-1 text-[0.68rem] font-bold text-[#9b6f16]">審査中 {pendingCount}</span>}{link.href === '/profile' && completenessPercent !== null && completenessPercent < 100 && <span className="rounded-full bg-[#f5c45b]/30 px-2.5 py-1 text-[0.68rem] font-bold text-[#9b6f16]">完成度 {completenessPercent}%</span>}</div><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#c85f41]">{link.eyebrow}</p><h3 className="mt-2 text-lg font-extrabold tracking-[-0.03em]">{link.title}</h3><p className="mt-2 text-sm leading-6 text-[#17263d]/55">{link.description}</p>{link.href === '/profile' && completenessPercent !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#17263d]/10"><div className="h-full rounded-full bg-gradient-to-r from-[#e16f4d] to-[#f5c45b]" style={{ width: `${completenessPercent}%` }} /></div>}</div></Link></li>)}
        </ul>
      </section>

      <section className="relative mx-auto w-full max-w-6xl"><div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c85f41]">Around TechTies</p><h2 className="text-2xl font-extrabold tracking-[-0.05em] sm:text-3xl">コミュニティからのお知らせ</h2></div><span className="rounded-full border border-[#17263d]/10 px-3 py-1 text-[0.65rem] font-bold text-[#17263d]/45">PR</span></div><div className="grid gap-3 md:grid-cols-2">{DUMMY_ADS.map((ad) => <div key={ad.sponsor} className={`flex items-center gap-4 rounded-[1.4rem] ${ad.color} p-5`}><span className="text-3xl">{ad.icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#17263d]/50">{ad.sponsor}</p><p className="mt-1 font-bold leading-6 text-[#17263d]">{ad.headline}</p></div><span className="shrink-0 rounded-full bg-white/55 px-3 py-1.5 text-xs font-bold text-[#17263d]/70">詳しく見る</span></div>)}</div></section>

      <section className="relative mx-auto w-full max-w-6xl pb-4"><div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c85f41]">Coming up</p><h2 className="text-2xl font-extrabold tracking-[-0.05em] sm:text-3xl">次のイベント</h2></div><span className="rounded-full border border-[#17263d]/10 px-3 py-1 text-[0.65rem] font-bold text-[#17263d]/45">PR</span></div><div className="flex gap-4 overflow-x-auto pb-3">{DUMMY_EVENTS.map((event) => <div key={event.title} className="flex w-72 shrink-0 flex-col gap-2 rounded-[1.4rem] border border-[#17263d]/10 bg-[#fffaf3] p-5 shadow-[0_16px_35px_-28px_rgba(23,38,61,0.5)]"><span className="text-3xl">{event.icon}</span><span className="text-xs font-bold text-[#c85f41]">{event.date}</span><span className="font-extrabold">{event.title}</span><p className="text-sm leading-6 text-[#17263d]/55">{event.description}</p></div>)}</div></section>
    </div>
  );
}
