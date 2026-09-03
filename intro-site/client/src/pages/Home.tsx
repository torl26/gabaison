import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  LockKeyhole,
  Menu,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { appHref } from "@/App";

type HomeProps = { scrolled: boolean };

type IconType = typeof Compass;

const categories: { icon: IconType; number: string; title: string; detail: string; examples: string[]; accent: string }[] = [
  {
    icon: BriefcaseBusiness,
    number: "01",
    title: "キャリア相談",
    detail: "進路や働き方のモヤモヤを、少し先を歩く人と整理する。",
    examples: ["業界の選び方", "ESを始める前の整理", "卒業後の進路"],
    accent: "clay",
  },
  {
    icon: Code2,
    number: "02",
    title: "スキル・技術",
    detail: "学習の壁を越えるために、次に試すことを一緒に見つける。",
    examples: ["Web開発の学習順", "ポートフォリオ", "コードレビュー"],
    accent: "navy",
  },
  {
    icon: Lightbulb,
    number: "03",
    title: "プロジェクト支援",
    detail: "つくる途中の迷いに、経験者の視点と小さなヒントを。",
    examples: ["アイデアの絞り込み", "チームの役割分担", "発表の準備"],
    accent: "gold",
  },
  {
    icon: GraduationCap,
    number: "04",
    title: "学業・研究",
    detail: "テーマ選びや学び方を、もう一つの視点から考える。",
    examples: ["研究テーマの選び方", "ゼミとの向き合い方", "学習計画"],
    accent: "mint",
  },
];

const faqs = [
  { q: "どんなことを相談できますか？", a: "キャリア、スキル・技術、プロジェクト、学業・研究の4カテゴリから、メンターのプロフィールに合わせて相談できます。具体的な悩みがまだ言葉になっていなくても大丈夫です。" },
  { q: "相談相手はどうやって決まりますか？", a: "プロフィールや対応カテゴリ、スキル、相談できること、対応可能な時間帯を見ながら、自分に合うメンターを探せます。申請内容を確認したメンターが承認するとチャットが始まります。" },
  { q: "すぐに返信はもらえますか？", a: "返信のタイミングはメンターによって異なります。プロフィールに表示される受付状況や応答情報を参考にしてください。返信を必ずお約束するサービスではありません。" },
  { q: "メンターとして参加できますか？", a: "経験を分かち合いたい方は、メンターとして登録できます。対応カテゴリや相談できる内容、対応可能な時間帯を自分のプロフィールで設定できます。" },
];

function Logo() {
  return (
    <a href="#top" className="group flex items-center gap-3" aria-label="TechTies ホーム">
      <span className="relative flex size-10 items-center justify-center rounded-2xl bg-[#e16f4d] text-[#fff8ed] shadow-[0_10px_24px_-12px_rgba(196,85,54,0.9)] transition-transform duration-200 group-hover:-rotate-6">
        <HeartHandshake size={20} strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#f5c45b] ring-2 ring-[#fcf6eb]" />
      </span>
      <span className="font-brand text-[1.5rem] font-extrabold tracking-[-0.06em] text-[#17263d]">TechTies</span>
    </a>
  );
}

function AppLink({ href, children, className = "", onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <a href={appHref(href)} onClick={onClick} className={className}>{children}</a>;
}

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`mb-5 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] ${light ? "text-[#f5c45b]" : "text-[#c85f41]"}`}><span className={`h-px w-8 ${light ? "bg-[#f5c45b]" : "bg-[#c85f41]"}`} />{children}</div>;
}

export default function Home({ scrolled }: HomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-[#fcf6eb] text-[#17263d]">
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-[#17263d]/10 bg-[#fcf6eb]/90 shadow-[0_8px_35px_-25px_rgba(23,38,61,0.6)] backdrop-blur-xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#17263d]/72 lg:flex">
            <a className="transition-colors hover:text-[#c85f41]" href="#about">TechTiesについて</a>
            <a className="transition-colors hover:text-[#c85f41]" href="#categories">相談できること</a>
            <a className="transition-colors hover:text-[#c85f41]" href="#how">使い方</a>
            <a className="transition-colors hover:text-[#c85f41]" href="#safety">安心への取り組み</a>
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <AppLink href="/login" className="text-sm font-bold text-[#17263d]/72 transition-colors hover:text-[#c85f41]">ログイン</AppLink>
            <AppLink href="/signup?role=student" className="inline-flex items-center gap-2 rounded-full bg-[#e16f4d] px-5 py-3 text-sm font-bold text-[#fff8ed] shadow-[0_12px_22px_-14px_rgba(196,85,54,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#cf5f40] active:scale-[0.97]">無料で始める <ArrowUpRight size={15} /></AppLink>
          </div>
          <button aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} onClick={() => setMenuOpen((value) => !value)} className="rounded-full p-2 text-[#17263d] transition-colors hover:bg-[#17263d]/5 lg:hidden">
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-[#17263d]/10 bg-[#fcf6eb] px-5 pb-6 pt-3 shadow-lg lg:hidden"><nav className="flex flex-col gap-1 text-sm font-bold"><a onClick={closeMenu} href="#about" className="rounded-xl px-3 py-3 hover:bg-white">TechTiesについて</a><a onClick={closeMenu} href="#categories" className="rounded-xl px-3 py-3 hover:bg-white">相談できること</a><a onClick={closeMenu} href="#how" className="rounded-xl px-3 py-3 hover:bg-white">使い方</a><a onClick={closeMenu} href="#safety" className="rounded-xl px-3 py-3 hover:bg-white">安心への取り組み</a><div className="mt-3 grid grid-cols-2 gap-2"><AppLink onClick={closeMenu} href="/login" className="rounded-full border border-[#17263d]/15 px-4 py-3 text-center">ログイン</AppLink><AppLink onClick={closeMenu} href="/signup?role=student" className="rounded-full bg-[#e16f4d] px-4 py-3 text-center text-[#fff8ed]">無料で始める</AppLink></div></nav></div>}
      </header>

      <main>
        <section className="relative isolate min-h-[760px] overflow-hidden pt-[76px] lg:min-h-[820px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(245,196,91,0.24),transparent_27%),radial-gradient(circle_at_88%_20%,rgba(225,111,77,0.18),transparent_28%)]" />
          <div className="grain absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -right-32 top-28 size-[440px] rounded-full border border-[#e16f4d]/15 sm:size-[620px]" />
          <div className="pointer-events-none absolute -right-20 top-44 size-[320px] rounded-full bg-[#f5c45b]/20 blur-3xl sm:size-[480px]" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-24">
            <div className="relative z-10 max-w-[610px] animate-fade-up">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e16f4d]/25 bg-white/60 px-3 py-2 text-[0.7rem] font-bold tracking-[0.12em] text-[#c85f41] shadow-sm backdrop-blur-sm"><Sparkles size={14} /> STUDENT × MENTOR COMMUNITY</div>
              <h1 className="font-display text-[clamp(2.8rem,4.5vw,4.5rem)] font-extrabold leading-[1.06] tracking-[-0.075em] text-[#17263d] [text-wrap:balance]"><span className="block lg:hidden">一人で<br />抱え込まない、</span><span className="hidden lg:block lg:whitespace-nowrap">一人で抱え込まない、</span><span className="block text-[#c85f41]">次の一歩を。</span></h1>
              <p className="mt-7 max-w-[460px] text-base leading-8 text-[#17263d]/65 sm:text-lg">学び、つくること、進路のこと。<br className="hidden sm:block" />あなたの今に近い経験を持つ先輩と、気軽に話せる場所です。</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <AppLink href="/signup?role=student" className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#e16f4d] px-6 py-4 text-sm font-bold text-[#fff8ed] shadow-[0_18px_35px_-18px_rgba(196,85,54,0.95)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#cf5f40] active:scale-[0.97]">学生として相談を始める <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></AppLink>
                <AppLink href="/signup?role=mentor" className="group inline-flex items-center justify-center gap-3 rounded-full border border-[#17263d]/20 bg-white/60 px-6 py-4 text-sm font-bold text-[#17263d] transition-all duration-200 hover:-translate-y-1 hover:border-[#17263d]/40 hover:bg-white active:scale-[0.97]">メンターとして参加する <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></AppLink>
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-[#17263d]/48"><LockKeyhole size={14} />登録は約1分。自分のペースで始められます。</div>
            </div>
            <div className="relative min-h-[430px] animate-fade-up [animation-delay:120ms] lg:min-h-[590px]">
              <div className="absolute -right-3 top-0 z-20 rotate-3 rounded-2xl bg-[#17263d] px-4 py-3 text-[#fff8ed] shadow-xl sm:right-6 sm:top-4"><div className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.14em] text-[#f5c45b]"><MessageCircle size={13} /> TODAY'S TIE</div><p className="mt-1 font-display text-lg font-bold">「まずは話してみよう」</p></div>
              <div className="absolute left-0 top-14 z-10 w-[94%] overflow-hidden rounded-[2.25rem] border-[10px] border-white/70 bg-[#eab18e] shadow-[0_40px_70px_-34px_rgba(23,38,61,0.42)] sm:left-8 sm:w-[90%] lg:left-5 lg:top-8 lg:w-[96%]"><img src="/manus-storage/techties-hero_e02618ab.png" alt="学生とメンターがテーブルを囲んで会話している様子" className="aspect-[4/3] h-full w-full object-cover" /></div>
              <div className="absolute -bottom-1 left-2 z-20 flex rotate-[-4deg] items-center gap-3 rounded-2xl border border-[#17263d]/10 bg-[#fffaf3] px-4 py-3 shadow-[0_18px_35px_-18px_rgba(23,38,61,0.32)] sm:bottom-1 sm:left-4"><span className="flex size-9 items-center justify-center rounded-xl bg-[#f5c45b]/30 text-[#c85f41]"><Search size={18} /></span><div><p className="text-[0.63rem] font-bold uppercase tracking-[0.12em] text-[#17263d]/45">Find your person</p><p className="text-sm font-bold">自分に合う人を探す</p></div></div>
              <div className="absolute -bottom-6 right-1 hidden rotate-6 rounded-full border-8 border-[#fcf6eb] bg-[#b8d7c5] px-5 py-4 font-display text-sm font-extrabold text-[#17263d] shadow-lg sm:block">small talk<br /><span className="text-[#c85f41]">big change</span></div>
            </div>
          </div>
          <a href="#about" aria-label="ページをスクロール" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#17263d]/40 transition-colors hover:text-[#c85f41] lg:flex"><span>scroll to explore</span><ArrowDown size={15} className="animate-bounce" /></a>
        </section>

        <section id="about" className="relative bg-[#17263d] py-24 text-[#fff8ed] sm:py-32">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:80px_80px]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-10">
            <div><SectionLabel light>Why TechTies</SectionLabel><h2 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">答えを急がなくていい。</span><span className="block whitespace-nowrap text-[#f5c45b]">まずは、話してみる。</span></h2></div>
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12"><div><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#f5c45b] text-[#17263d]"><Compass size={22} /></div><h3 className="text-lg font-bold">悩みのままで、相談できる</h3><p className="mt-3 text-sm leading-7 text-[#fff8ed]/60">「何を聞きたいか分からない」からでも大丈夫。話しながら、考えが少しずつ見えてきます。</p></div><div><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#e16f4d] text-[#fff8ed]"><Users size={22} /></div><h3 className="text-lg font-bold">経験の近い人とつながる</h3><p className="mt-3 text-sm leading-7 text-[#fff8ed]/60">プロフィールや相談テーマを見て、自分の今に近いメンターを探せます。</p></div><div><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#b8d7c5] text-[#17263d]"><HeartHandshake size={22} /></div><h3 className="text-lg font-bold">お互いが納得してから始まる</h3><p className="mt-3 text-sm leading-7 text-[#fff8ed]/60">相談内容を添えて申請。メンターの承認後にチャットが始まる、無理のない関係です。</p></div><div><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#fff8ed] text-[#c85f41]"><Sparkles size={22} /></div><h3 className="text-lg font-bold">小さな一歩を、何度でも</h3><p className="mt-3 text-sm leading-7 text-[#fff8ed]/60">進路、学び、制作。今の自分に必要なテーマから、いつでも相談を始められます。</p></div></div>
          </div>
        </section>

        <section id="categories" className="bg-[#fcf6eb] py-24 sm:py-32">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><SectionLabel>Find your tie</SectionLabel><h2 className="max-w-[680px] font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">相談の入口は、</span><span className="block whitespace-nowrap text-[#c85f41]">ひとつじゃない。</span></h2></div><p className="max-w-[330px] text-sm leading-7 text-[#17263d]/55">今いちばん気になっていることから、あなたに合う会話を見つけてください。</p></div>
            <div className="mt-14 grid gap-4 md:grid-cols-2">{categories.map((category, index) => { const Icon = category.icon; const accent = category.accent === "navy" ? "bg-[#17263d] text-[#fff8ed]" : category.accent === "gold" ? "bg-[#f5c45b] text-[#17263d]" : category.accent === "mint" ? "bg-[#b8d7c5] text-[#17263d]" : "bg-[#e16f4d] text-[#fff8ed]"; return <div key={category.number} className="group relative overflow-hidden rounded-[1.75rem] border border-[#17263d]/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-30px_rgba(23,38,61,0.5)] sm:p-9"><span className="absolute right-7 top-6 font-display text-5xl font-extrabold tracking-[-0.08em] text-[#17263d]/8">{category.number}</span><div className={`mb-7 flex size-12 items-center justify-center rounded-2xl ${accent}`}><Icon size={22} /></div><h3 className="font-display text-2xl font-extrabold tracking-[-0.04em]">{category.title}</h3><p className="mt-3 max-w-[410px] text-sm leading-7 text-[#17263d]/62">{category.detail}</p><div className="mt-7 flex flex-wrap gap-2">{category.examples.map((example) => <span key={example} className="rounded-full border border-[#17263d]/12 px-3 py-1.5 text-xs font-semibold text-[#17263d]/62">{example}</span>)}</div><span className="absolute bottom-8 right-8 flex size-10 items-center justify-center rounded-full border border-[#17263d]/10 text-[#17263d]/40 transition-all duration-200 group-hover:border-[#e16f4d] group-hover:bg-[#e16f4d] group-hover:text-white"><ArrowUpRight size={17} /></span></div> })}</div>
          </div>
        </section>

        <section id="how" className="relative overflow-hidden bg-[#f2dfc9] py-24 sm:py-32"><div className="grain absolute inset-0 opacity-25" /><div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10"><div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24"><div><SectionLabel>How it works</SectionLabel><h2 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">3ステップで、</span><span className="block whitespace-nowrap text-[#c85f41]">相談が始まる。</span></h2><p className="mt-7 max-w-[370px] text-sm leading-7 text-[#17263d]/60">登録からチャットまで、やることはシンプル。自分のペースで、話したい相手を探せます。</p><AppLink href="/signup?role=student" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#17263d] px-6 py-4 text-sm font-bold text-[#fff8ed] transition-all duration-200 hover:-translate-y-1 hover:bg-[#243b5c] active:scale-[0.97]">まずは登録してみる <ArrowRight size={17} /></AppLink></div><div className="relative"><div className="absolute bottom-7 left-[29px] top-7 w-px bg-[#17263d]/15 sm:left-[35px]" /><div className="relative flex flex-col gap-8"><div className="flex gap-6 sm:gap-8"><span className="relative z-10 flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[#e16f4d] font-display text-xl font-extrabold text-white shadow-lg">01</span><div className="rounded-[1.5rem] border border-white/70 bg-[#fffaf3]/75 p-6 shadow-sm sm:p-7"><div className="mb-3 flex items-center gap-3 text-[#c85f41]"><FileText size={19} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Create your profile</span></div><h3 className="text-xl font-bold">プロフィールを整える</h3><p className="mt-2 text-sm leading-7 text-[#17263d]/58">今の自分、話せること、相談したいことを、無理のない範囲で書きます。</p></div></div><div className="flex gap-6 sm:gap-8"><span className="relative z-10 flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[#f5c45b] font-display text-xl font-extrabold text-[#17263d] shadow-lg">02</span><div className="rounded-[1.5rem] border border-white/70 bg-[#fffaf3]/75 p-6 shadow-sm sm:p-7"><div className="mb-3 flex items-center gap-3 text-[#c85f41]"><Search size={19} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Find your mentor</span></div><h3 className="text-xl font-bold">メンターを探して、申請する</h3><p className="mt-2 text-sm leading-7 text-[#17263d]/58">カテゴリやプロフィールを見ながら、話してみたい人へ相談内容を添えて申請します。</p></div></div><div className="flex gap-6 sm:gap-8"><span className="relative z-10 flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[#17263d] font-display text-xl font-extrabold text-white shadow-lg">03</span><div className="rounded-[1.5rem] border border-white/70 bg-[#fffaf3]/75 p-6 shadow-sm sm:p-7"><div className="mb-3 flex items-center gap-3 text-[#c85f41]"><MessageCircle size={19} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Start talking</span></div><h3 className="text-xl font-bold">承認されたら、チャットへ</h3><p className="mt-2 text-sm leading-7 text-[#17263d]/58">お互いが納得してから会話がスタート。聞きたいことを、少しずつ話していきます。</p></div></div></div></div></div></div></section>

        <section id="safety" className="bg-[#fffaf3] py-24 sm:py-32"><div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10"><div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24"><div className="order-2 overflow-hidden rounded-[2rem] bg-[#ecd1b8] shadow-[0_30px_60px_-35px_rgba(23,38,61,0.45)] lg:order-1"><img src="/manus-storage/techties-community_7415bd3b.png" alt="ノートと付箋を囲んで相談の準備をしている様子" className="aspect-[3/2] h-full w-full object-cover" /></div><div className="order-1 lg:order-2"><SectionLabel>Carefully connected</SectionLabel><h2 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">お互いが納得してから、</span><span className="block whitespace-nowrap text-[#c85f41]">つながる。</span></h2><p className="mt-7 max-w-[470px] text-sm leading-7 text-[#17263d]/60">TechTiesは、相談を始める前の小さな安心を大切にします。申請内容を確認し、承認されたマッチングでチャットを始める仕組みです。</p><div className="mt-9 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl border border-[#17263d]/10 bg-[#fcf6eb] p-5"><ShieldCheck className="text-[#c85f41]" size={22} /><h3 className="mt-4 font-bold">承認してから会話</h3><p className="mt-2 text-xs leading-6 text-[#17263d]/55">申請内容を見てから、お互いに納得した状態でチャットへ進めます。</p></div><div className="rounded-2xl border border-[#17263d]/10 bg-[#fcf6eb] p-5"><LockKeyhole className="text-[#c85f41]" size={22} /><h3 className="mt-4 font-bold">困ったときの選択肢</h3><p className="mt-2 text-xs leading-6 text-[#17263d]/55">ブロックや通報の導線を用意。無理にやり取りを続ける必要はありません。</p></div></div><a href="#faq" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c85f41] underline decoration-[#c85f41]/30 underline-offset-4 transition-colors hover:text-[#a84c33]">よくある質問を見る <ArrowRight size={16} /></a></div></div></div></section>

        <section className="bg-[#e16f4d] py-24 text-[#fff8ed] sm:py-32"><div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10"><div className="grid items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]"><div><SectionLabel light>For both sides</SectionLabel><h2 className="max-w-[700px] font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">相談したい人も、</span><span className="block whitespace-nowrap text-[#f5c45b]">経験を渡したい人も。</span></h2></div><div><p className="text-sm leading-7 text-white/75">学生として今の悩みを相談することも、メンターとして自分の経験を手渡すことも。TechTiesは、どちらの一歩も歓迎します。</p><div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col"><AppLink href="/signup?role=student" className="inline-flex items-center justify-between rounded-full bg-[#fff8ed] px-5 py-4 text-sm font-bold text-[#17263d] transition-all hover:-translate-y-1 hover:bg-white active:scale-[0.97]">学生として始める <ArrowRight size={17} /></AppLink><AppLink href="/signup?role=mentor" className="inline-flex items-center justify-between rounded-full border border-white/45 px-5 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-white/10 active:scale-[0.97]">メンターとして参加する <ArrowRight size={17} /></AppLink></div></div></div></div></section>

        <section id="faq" className="bg-[#fcf6eb] py-24 sm:py-32"><div className="mx-auto grid max-w-[960px] gap-12 px-5 sm:px-8 md:grid-cols-[0.72fr_1.28fr] md:gap-20"><div><SectionLabel>FAQ</SectionLabel><h2 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">気になることから、<br /><span className="text-[#c85f41]">どうぞ。</span></h2><p className="mt-6 text-sm leading-7 text-[#17263d]/55">はじめる前に知っておきたいことをまとめました。</p></div><div className="flex flex-col divide-y divide-[#17263d]/12">{faqs.map((faq, index) => { const isOpen = openFaq === index; return <div key={faq.q} className="py-5 first:pt-0 last:pb-0"><button onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-5 text-left text-sm font-bold transition-colors hover:text-[#c85f41]" aria-expanded={isOpen}><span>{faq.q}</span><span className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-[#17263d]/15 transition-transform duration-200 ${isOpen ? "rotate-180 bg-[#17263d] text-white" : ""}`}><ChevronDown size={16} /></span></button><div className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><p className="pt-4 pr-12 text-sm leading-7 text-[#17263d]/58">{faq.a}</p></div></div></div> })}</div></div></section>

        <section className="relative overflow-hidden bg-[#17263d] py-24 text-[#fff8ed] sm:py-32"><div className="absolute -right-20 -top-36 size-[430px] rounded-full border border-[#f5c45b]/20" /><div className="absolute -bottom-48 -left-20 size-[420px] rounded-full bg-[#e16f4d]/20 blur-3xl" /><div className="relative mx-auto max-w-[980px] px-5 text-center sm:px-8"><div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl bg-[#f5c45b] text-[#17263d]"><Send size={24} /></div><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#f5c45b]">Your next tie starts here</p><h2 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.055em] [text-wrap:balance]"><span className="block whitespace-nowrap">今日の小さな相談が、</span><span className="block whitespace-nowrap text-[#e16f4d]">明日の自信になる。</span></h2><p className="mx-auto mt-7 max-w-[480px] text-sm leading-7 text-white/60">今のあなたに必要な相手を探すところから、TechTiesを始めてみませんか。</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><AppLink href="/signup?role=student" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#e16f4d] px-7 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-[#cf5f40] active:scale-[0.97]">学生として相談を始める <ArrowRight size={17} /></AppLink><AppLink href="/login" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 px-7 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-white/10 active:scale-[0.97]">ログインする <ArrowUpRight size={17} /></AppLink></div></div></section>
      </main>

      <footer className="bg-[#101d30] text-white/60"><div className="mx-auto max-w-[1240px] px-5 pb-8 pt-14 sm:px-8 lg:px-10"><div className="flex flex-col justify-between gap-10 md:flex-row"><div><Logo /><p className="mt-5 max-w-[290px] text-sm leading-7 text-white/45">学生とメンターが、<br />お互いの次の一歩をつくる場所。</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm sm:grid-cols-3"><div className="flex flex-col gap-4"><a href="#about" className="transition-colors hover:text-white">TechTiesについて</a><a href="#categories" className="transition-colors hover:text-white">相談できること</a><a href="#how" className="transition-colors hover:text-white">使い方</a></div><div className="flex flex-col gap-4"><a href="#safety" className="transition-colors hover:text-white">安心への取り組み</a><a href="#faq" className="transition-colors hover:text-white">よくある質問</a><AppLink href="/login" className="transition-colors hover:text-white">ログイン</AppLink></div><div className="col-span-2 flex flex-col gap-4 sm:col-span-1"><AppLink href="/signup?role=student" className="font-bold text-[#f5c45b] transition-colors hover:text-white">無料で始める <ArrowUpRight className="inline" size={14} /></AppLink><a href="#top" className="transition-colors hover:text-white">ページ上部へ ↑</a></div></div></div><div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row"><span>© 2026 TechTies</span><span>小さな会話が、次の一歩をつくる。</span></div></div></footer>
    </div>
  );
}
