import Link from 'next/link';
import {
  Play,
  Sliders,
  Sparkles,
  Sword,
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
    'Life Simulation',
    'Choice-Driven',
    'Free-to-Play',
    'No Ads',
    'Browser-Based',
  ];

  const features = [
    {
      title: 'Every Life is Different',
      description:
        'Massive narrative variety with 365+ hand-crafted dilemmas, procedural destiny twists, an anti-repetition memory engine, and a complete custom-life creator.',
      icon: Sparkles,
      badge: 'Unpredictable',
    },
    {
      title: 'Reactive Stats, Sounds & Moments',
      description:
        'Live martial prowess, health, honor, and happiness react dynamically to every choice with spatial audio cues, celebratory stings, and tactile haptic feedback.',
      icon: Zap,
      badge: 'Dynamic Feedback',
    },
    {
      title: '100% Free Forever, No Ads, No Accounts',
      description:
        'Instant browser play with zero paywalls, zero account sign-ups, and zero tracking. Pure, unadulterated choice-driven storytelling.',
      icon: CheckCircle2,
      badge: 'Free & Open',
    },
  ];

  const pillars = [
    {
      title: 'Martial Mastery & Honor',
      desc: 'Train in legendary martial disciplines, earn battlefield glory, climb clan hierarchies, and uphold strict chivalric oaths.',
      icon: Sword,
    },
    {
      title: 'Romance & Lineage',
      desc: 'Form passionate courtships, navigate high-society intrigues, settle dowries, marry, or risk scandalous consequence-driven affairs.',
      icon: Heart,
    },
    {
      title: 'Generational Dynasty',
      desc: 'Accumulate estates, titles, and ancestral relics, drafting wills to designate worthy heirs and ensure your house reigns forever.',
      icon: Users,
    },
    {
      title: '365+ Procedural Dilemmas',
      desc: 'From street-urchin brawls to imperial court conspiracies, encounter consequential events tailored to your life stage and reputation.',
      icon: Scroll,
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
              <Sword className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider text-white group-hover:text-rose-200 transition-colors">
                Jibon Niye Khela
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                Modern Martial Life Sim
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-zinc-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Free in Browser
            </span>
            <Link
              href="/play?start=1"
              data-testid="header-play-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b23a3b] hover:bg-[#c44344] border-b-2 border-b-[#7a1c1d] active:border-b-0 active:translate-y-0.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-rose-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Play className="size-3.5 fill-current" />
              <span>Play Now</span>
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
              <span>Choice-Driven Medieval Life Simulation</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl leading-[1.1]"
            >
              Live. Conquer. Love. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
                Jibon Niye Khela
              </span>
            </h1>

            {/* Hook Line */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
              A choice-driven medieval modern-martial life simulation. Forge your destiny, master ancient martial arts, nurture noble bonds, and carve a legendary dynasty across generations.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <Link
                href="/play?start=1"
                data-testid="new-game"
                className="group relative flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-rose-950/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Play className="size-4 fill-current transition-transform group-hover:scale-110" />
                <span>Play Free in Browser</span>
                <ArrowRight className="size-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/play?custom=1"
                data-testid="open-custom-life-btn"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-6 py-4 text-sm font-semibold tracking-wider text-zinc-200 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Sliders className="size-4 text-zinc-400" />
                <span>Custom Life</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> No signup required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> 100% Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Zero paywalls or ads
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
                {/* Visual mockup of the 3-region Modern Martial UI */}
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6 justify-between select-none">
                  {/* Mock Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-300">
                        <Award className="size-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">Lord Kazi Rayhan</div>
                        <div className="text-xs text-zinc-400 font-mono">Age 24 • Swordmaster of Bengal</div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                      <span className="text-rose-400 font-bold">Health 92%</span>
                      <span className="text-blue-400 font-bold">Happiness 88%</span>
                      <span className="text-amber-400 font-bold">Martial 95%</span>
                      <span className="text-yellow-400 font-bold">Honor 85%</span>
                    </div>
                  </div>

                  {/* Mock Center Event & Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-auto items-center">
                    <div className="hidden md:block col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">Core Attributes</div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-300"><span>Martial Skill</span><span className="text-amber-400 font-bold">95</span></div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full"><div className="bg-amber-400 h-1.5 rounded-full w-[95%]" /></div>
                        <div className="flex justify-between text-zinc-300"><span>Honor Standing</span><span className="text-amber-400 font-bold">85</span></div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full"><div className="bg-amber-400 h-1.5 rounded-full w-[85%]" /></div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-6 rounded-2xl border border-rose-500/30 bg-zinc-900/90 p-5 sm:p-6 text-center shadow-2xl backdrop-blur-xl">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 mb-3">
                        <Sword className="size-3.5" />
                        <span>Grand Tournament Duel</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        The Master of the Jade Gate challenges you to a test of blades before the King.
                      </h2>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-zinc-200">
                          [1] Accept with ceremonial bow (+Martial, +Honor)
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-zinc-200">
                          [2] Propose wager of 500 gold (+Wealth)
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">Lineage & House</div>
                      <div className="mt-3 text-xs text-zinc-300 space-y-1.5">
                        <div>Dynasty: <span className="text-white font-semibold">House Rayhan</span></div>
                        <div>Spouse: <span className="text-rose-300 font-semibold">Lady Shireen</span></div>
                        <div>Heirs: <span className="text-amber-300 font-semibold">2 Eligible</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Controls */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-[11px] text-zinc-400 font-mono">Press ? anytime for keyboard shortcuts</span>
                    <span className="rounded-xl bg-[#b23a3b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                      Age (+1 Year)
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
              Why Jibon Niye Khela
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered for Deep Replayability
            </p>
            <p className="mt-4 text-sm sm:text-base text-zinc-400">
              Unlike static choose-your-own-adventure stories, every playthrough is powered by deterministic life progression, reactive audio feedback, and dynamic event cooling.
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
                  aria-label="Real captured gameplay footage showing event resolution and stat reactivity"
                  className="size-full object-cover"
                  data-testid="gameplay-video"
                >
                  <source src="/media/gameplay-demo.webm" type="video/webm" />
                </video>
                <div className="absolute top-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  ● Real Gameplay Footage
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
              Systems & Mechanics
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Forge Your Path Across Generations
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
              Ready to Begin Your Dynasty?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-zinc-300">
              No registration, no downloads, no fees. Just click and play in your browser instantly.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/play?start=1"
                data-testid="bottom-play-cta"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Play className="size-4 fill-current" />
                <span>Start Free Life</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-zinc-950 py-10 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sword className="size-4 text-rose-400" />
            <span className="font-semibold text-white">Jibon Niye Khela</span>
            <span>— Open-source browser life simulation.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] text-zinc-400">
              Desktop: Press <kbd className="rounded border border-white/20 bg-white/5 px-1 py-0.5 font-mono text-zinc-300">?</kbd> for shortcuts
            </span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
