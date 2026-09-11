import Link from 'next/link';
import {
  Play,
  Sliders,
  Sparkles,
  Heart,
  Scroll,
  Zap,
  CheckCircle2,
  Users,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';

export function LandingPage() {
  const tags = [
    'লাইফ সিমুলেশন',
    'চয়েস-চালিত',
    'ফ্রি-টু-প্লে',
    'অফলাইন ফallback',
    'ব্রাউজার-বেসড',
  ];

  const features = [
    {
      title: 'প্রতিটা জীবন আলাদা',
      description:
        'বয়স, স্ট্যাট, সম্পর্ক, আগের সিদ্ধান্ত আর ভাগ্যের উপর ভিত্তি করে নতুন নতুন ঢাকাইয়া ঘটনা বেছে নাও। কাস্টম লাইফ দিয়েও শুরু করতে পারো।',
      icon: Sparkles,
      badge: 'অনিশ্চিত',
    },
    {
      title: 'প্রতিক্রিয়াশীল স্ট্যাট, সাউন্ড আর মুহূর্ত',
      description:
        'স্বাস্থ্য, সুখ, বুদ্ধি, চেহারা, ট্যাকা আর সম্পর্কের পরিবর্তন তোমার পছন্দের ফল দেখায়—সাথে অ্যানিমেশন, সাউন্ড আর হ্যাপটিক ফিডব্যাক।',
      icon: Zap,
      badge: 'লাইভ ফিডব্যাক',
    },
    {
      title: '১০০% ফ্রি সবসময়, কোনো ঐড নাই, অ্যাকাউন্ট নাই',
      description:
        'কোনো সাইন-আপ বা পে-ওয়াল ছাড়াই ব্রাউজারে খেলো। Gemini বন্ধ থাকলেও লোকাল fallback ইভেন্টে গেম চলতে থাকে।',
      icon: CheckCircle2,
      badge: 'ফ্রি এন্ড ওপেন',
    },
  ];

  const pillars = [
    {
      title: 'পড়াশোনা, কামকাজ & ট্যাকা-পয়সা',
      desc: 'স্কুলে পড়ো, কাম খোঁজো, পারফরম্যান্স বাড়াও, সঞ্চয় করো, ঋণ নাও বা সম্পদ কিনে নিজের আর্থিক অবস্থা সামলাও।',
      icon: Scroll,
    },
    {
      title: 'প্রেম, সম্পর্ক & পরিবার',
      desc: 'ডেট করো, সম্পর্ক গড়ো, বিয়ে করো, পরিবারে সময় দাও, সন্তান নাও এবং তোমার সিদ্ধান্তে সম্পর্কের বন্ধন বদলাতে দেখো।',
      icon: Heart,
    },
    {
      title: 'পরিবার & উত্তরাধিকার',
      desc: 'ফ্যামিলি ট্রি দেখো, আত্মীয়দের সাথে সম্পর্ক রাখো, আর জীবন শেষ হলে যোগ্য উত্তরাধিকারী নিয়ে পরের গল্প চালিয়ে যাও।',
      icon: Users,
    },
    {
      title: 'ঢাকাইয়া ঘটনা & সিদ্ধান্ত',
      desc: 'শৈশব থেকে বুড়ো বয়স পর্যন্ত বয়স-উপযোগী ঘটনা সামলাও। Gemini নতুন কাহিনি বানাতে পারে, আর fallback ব্যাংক অফলাইনেও খেলা চালায়।',
      icon: Sparkles,
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500/30 selection:text-rose-200 overflow-x-hidden">
      {/* Background ambient lighting accents */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 size-[700px] rounded-full bg-rose-900/[0.08] blur-[150px]" />
        <div className="absolute top-1/2 -right-32 size-[600px] rounded-full bg-amber-600/[0.04] blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 size-[650px] rounded-full bg-emerald-600/[0.04] blur-[150px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1"
          >
            <div className="flex size-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform duration-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <Heart className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider text-white group-hover:text-rose-200 transition-colors">
                Jibon Niye Khela
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                ঢাকাইয়া লাইফ সিম
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-zinc-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ১০০% ফ্রি ব্রাউজারে
            </span>
            <Link
              href="/play?start=1"
              data-testid="header-play-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b23a3b] hover:bg-[#c44344] border-b-2 border-b-[#7a1c1d] active:border-b-0 active:translate-y-0.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-rose-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Play className="size-3.5 fill-current" />
              <span>এখনই খেলো</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10">
        {/* 1. HERO SECTION (Above the Fold) */}
        <section
          aria-labelledby="hero-heading"
          className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 lg:pt-24"
        >
          <div className="flex flex-col items-center text-center">
            {/* Top Pill Announcement */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-medium text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <Flame className="size-3.5 text-rose-400" />
              <span>চয়েস-চালিত ঢাকাইয়া লাইফ সিমুলেশন</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl leading-[1.1]"
            >
              বাঁচো। বেছে নাও। আবার শুরু করো। <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
                Jibon Niye Khela
              </span>
            </h1>

            {/* Hook Line */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
              একটা চয়েস-চালিত ঢাকাইয়া লাইফ সিমুলেশন। পড়াশোনা, কামকাজ, প্রেম, পরিবার, ট্যাকা-পয়সা আর জীবনের গ্যাঞ্জাম সামলায়া নিজের গল্প বানাও।
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <Link
                href="/play?start=1"
                data-testid="new-game"
                className="group relative flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-rose-950/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Play className="size-4 fill-current transition-transform group-hover:scale-110" />
                <span>ব্রাউজারে ফ্রি খেলো</span>
                <ArrowRight className="size-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/play?custom=1"
                data-testid="open-custom-life-btn"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-6 py-4 text-sm font-semibold tracking-wider text-zinc-200 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Sliders className="size-4 text-zinc-400" />
                <span>কাস্টম লাইফ</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> সাইন-আপ লাগে না
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> ১০০% ফ্রি সবসময়
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> কোনো পে-ওয়াল বা অ্যাড নাই
              </span>
            </div>

            {/* Atmospheric Visual Showcase (Real Reskinned UI Frame) */}
            <div className="mt-14 w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-rose-500/80" />
                  <div className="size-3 rounded-full bg-amber-500/80" />
                  <div className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="rounded-md border border-white/10 bg-black/40 px-4 py-1 text-[11px] font-mono text-zinc-400">
                  jibonniyekhela.app / chronicle
                </div>
                <div className="w-12" />
              </div>

              {/* Realistic Hero Visual / UI Snapshot */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-950 shadow-inner">
                {/* Visual mockup of the game dashboard */}
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6 justify-between select-none">
                  {/* Mock Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-300">
                        <Award className="size-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">কাজী রায়হান</div>
                        <div className="text-xs text-zinc-400 font-mono">বয়স ২৪ • সফটওয়্যার ডেভেলপার</div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                      <span className="text-rose-400 font-bold">স্বাস্থ্য ৯২%</span>
                      <span className="text-blue-400 font-bold">সুখ ৮৮%</span>
                      <span className="text-amber-400 font-bold">বুদ্ধি ৯৫%</span>
                      <span className="text-yellow-400 font-bold">চেহারা ৮৫%</span>
                    </div>
                  </div>

                  {/* Mock Center Event & Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-auto items-center">
                    <div className="hidden md:block col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">স্ট্যাট</div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-300"><span>বুদ্ধি</span><span className="text-amber-400 font-bold">95</span></div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full"><div className="bg-amber-400 h-1.5 rounded-full w-[95%]" /></div>
                        <div className="flex justify-between text-zinc-300"><span>চেহারা</span><span className="text-amber-400 font-bold">85</span></div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full"><div className="bg-amber-400 h-1.5 rounded-full w-[85%]" /></div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-6 rounded-2xl border border-rose-500/30 bg-zinc-900/90 p-5 sm:p-6 text-center shadow-2xl backdrop-blur-xl">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 mb-3">
                        <Sparkles className="size-3.5" />
                        <span>আজকের ঢাকাইয়া ঘটনা</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        অফিসের বস হঠাৎ কইরা কইলো, কালকের প্রেজেন্টেশনটা তোমাকেই দিতে হইবো।
                      </h2>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-zinc-200">
                          [১] রাত জাইগা প্রস্তুতি নে (+বুদ্ধি, -সুখ)
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-zinc-200">
                          [২] অসুস্থতার ভান কর (+সুখ, -ক্যারিয়ার)
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">বংশ & বাড়ি</div>
                      <div className="mt-3 text-xs text-zinc-300 space-y-1.5">
                        <div>কাজ: <span className="text-white font-semibold">ডেভেলপার</span></div>
                        <div>সঙ্গিনী: <span className="text-rose-300 font-semibold">শিরিন</span></div>
                        <div>সন্তান: <span className="text-amber-300 font-semibold">২ জন</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Controls */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-[11px] text-zinc-400 font-mono">いつでも ? চাপলে কীবোর্ড শর্টকাট</span>
                    <span className="rounded-xl bg-[#b23a3b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                      বয়স (+১ বছর)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE FEATURES & GAMEPLAY SECTION */}
        <section
          aria-labelledby="features-heading"
          className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-white/[0.08]"
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2
              id="features-heading"
              className="text-xs font-mono uppercase tracking-widest text-rose-400"
            >
              কেন জীবন নিয়া খেলা
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              গভীর রিপ্লेबিলিটির জন্য এনজিনিয়ারড
            </p>
            <p className="mt-4 text-sm sm:text-base text-zinc-400">
              শুধু স্ট্যাটিক গল্প না—বয়স, চরিত্রের অবস্থা, আগের ঘটনা আর তোমার সিদ্ধান্ত মিলায়া প্রতিটি জীবন এগোয়।
            </p>
          </div>

          {/* Gameplay Video Showcase & Live Reactive Demo */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Captured Gameplay Video */}
              <div className="w-full lg:w-7/12 relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/media/gameplay-poster.png"
                  aria-label="রিয়েল গেমপ্লে ফুটেজ দেখাচ্ছে ইভেন্ট রেজোলিউশন আর স্ট্যাট রিএক্টিভিটি"
                  className="size-full object-cover"
                  data-testid="gameplay-video"
                >
                  <source src="/media/gameplay-demo.webm" type="video/webm" />
                </video>
                <div className="absolute top-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  ● রিয়েল গেমপ্লে ফুটেজ
                </div>
              </div>

              {/* 3 Short Punchy Bullet Points */}
              <div className="w-full lg:w-5/12 flex flex-col gap-5">
                {features.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 transition-colors hover:border-rose-500/30 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {feat.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tag List */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/20 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 3. GAMEPLAY PILLARS */}
        <section
          aria-labelledby="pillars-heading"
          className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-white/[0.08]"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="pillars-heading" className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              সিস্টেম & মেকানিক্স
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              নিজের পথ বানাও
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. FINAL CALL TO ACTION */}
        <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 to-zinc-950 p-8 sm:p-14 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              নিজের জীবন শুরু করার জন্য প্রস্তুত?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-zinc-300">
              কোনো রেজিস্ট্রেশন নাই, কোনো ডাউনলোড নাই, কোনো ফি নাই। শুধু ক্লিক করো আর ব্রাউজারে ইনস্ট্যান্ট খেলো।
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/play?start=1"
                data-testid="bottom-play-cta"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Play className="size-4 fill-current" />
                <span>ফ্রি জীবন শুরু কর</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-zinc-950 py-10 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-rose-400" />
            <span className="font-semibold text-white">Jibon Niye Khela</span>
            <span>— ঢাকাইয়া ব্রাউজার লাইফ সিমুলেশন।</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] text-zinc-400">
              ডেস্কটপ: <kbd className="rounded border border-white/20 bg-white/5 px-1 py-0.5 font-mono text-zinc-300">?</kbd> চাপলে শর্টকাট
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
