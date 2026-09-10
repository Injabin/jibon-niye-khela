'use client';

import React from 'react';
import { DHAKAIYA_VOICE_GUIDE } from '@/content/bangla/voice-guide';

const CONJUNCTS = [
  { char: 'ক্ষ', example: 'পরীক্ষা', meaning: 'Exam' },
  { char: 'জ্ঞ', example: 'জ্ঞান', meaning: 'Wisdom' },
  { char: 'ঞ্চ', example: 'চঞ্চল', meaning: 'Restless' },
  { char: 'ঞ্ছ', example: 'বাঞ্ছা', meaning: 'Desire' },
  { char: 'ঞ্জ', example: 'গ্যাঞ্জাম', meaning: 'Trouble' },
  { char: 'ঙ্ক', example: 'শঙ্কা', meaning: 'Fear' },
  { char: 'ঙ্গ', example: 'বাঙালি', meaning: 'Bengali' },
  { char: 'ঙ্ঘ', example: 'লঙ্ঘন', meaning: 'Violation' },
  { char: 'ণ্ড', example: 'মাথামুণ্ডু', meaning: 'Head-tail' },
  { char: 'ণ্ঠ', example: 'কণ্ঠ', meaning: 'Throat/Voice' },
  { char: 'ত্ত', example: 'উত্তেজনা', meaning: 'Excitement' },
  { char: 'ত্থ', example: 'উত্থান', meaning: 'Rise' },
  { char: 'ত্র', example: 'ছাত্র', meaning: 'Student' },
  { char: 'দ্ব', example: 'দ্বন্দ', meaning: 'Conflict' },
  { char: 'ধ্ব', example: 'ধ্বংস', meaning: 'Destruction' },
  { char: 'ন্ত', example: 'শান্তি', meaning: 'Peace' },
  { char: 'ন্থ', example: 'গ্রন্থ', meaning: 'Book' },
  { char: 'ন্দ', example: 'চান্দি', meaning: 'Scalp/Head' },
  { char: 'ন্ধ', example: 'বন্ধু', meaning: 'Friend' },
  { char: 'প্ত', example: 'দীপ্ত', meaning: 'Shining' },
  { char: 'ব্দ', example: 'শব্দ', meaning: 'Sound' },
  { char: 'ব্ধ', example: 'স্তব্ধ', meaning: 'Silenced' },
  { char: 'ম্প', example: 'অলিম্পিক', meaning: 'Olympics' },
  { char: 'ম্ব', example: 'সম্বল', meaning: 'Means/Wealth' },
  { char: 'ম্ভ', example: 'সম্ভব', meaning: 'Possible' },
  { char: 'ল্ক', example: 'বল্কল', meaning: 'Bark' },
  { char: 'ল্প', example: 'গল্প', meaning: 'Story' },
  { char: 'ষ্ক', example: 'শুষ্ক', meaning: 'Dry' },
  { char: 'ষ্ট', example: 'কষ্ট', meaning: 'Hardship' },
  { char: 'ষ্ঠ', example: 'শ্রেষ্ঠ', meaning: 'Supreme' },
  { char: 'ষ্ণ', example: 'উষ্ণ', meaning: 'Warm' },
  { char: 'স্ক', example: 'স্কুল', meaning: 'School' },
  { char: 'স্ত', example: 'দোস্ত', meaning: 'Friend' },
  { char: 'স্থ', example: 'গোরস্থান', meaning: 'Graveyard' },
  { char: 'স্ন', example: 'স্নেহ', meaning: 'Affection' },
  { char: 'স্প', example: 'স্পর্ধা', meaning: 'Audacity' },
  { char: 'স্ফ', example: 'স্ফুরণ', meaning: 'Spark' },
  { char: 'হ্ন', example: 'চিহ্ন', meaning: 'Sign' },
  { char: 'হ্ম', example: 'ব্রহ্মাণ্ড', meaning: 'Universe' },
  { char: 'হৃ', example: 'হৃদয়', meaning: 'Heart' },
];

export default function FontTestPage() {
  return (
    <main
      data-testid="font-test-page"
      className="min-h-screen w-full bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header Section */}
        <header className="border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
              Phase 1 Gate Verification
            </span>
            <span className="text-xs text-zinc-400">Unicode বাংলা লিপি ও টাইপোগ্রাফি</span>
          </div>
          <h1
            data-testid="main-heading"
            className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white"
          >
            জীবন নিয়ে খেলা — ঢাকাইয়া ফন্ট ও যুক্তাক্ষর টেস্ট
          </h1>
          <p className="mt-2 text-base text-zinc-400 font-body">
            Display Font: <span className="font-semibold text-emerald-300 font-display">Baloo Da 2</span> · Body Font: <span className="font-semibold text-rose-300 font-body">Hind Siliguri</span>
          </p>
        </header>

        {/* Canonical Lines Showcase */}
        <section
          data-testid="canonical-section"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur"
        >
          <h2 className="text-xl font-bold text-amber-300 font-display mb-4">
            ক্যানোনিকাল রেফারেন্স ডায়লগ (Canonical Ground-Truth)
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-950/80 p-4 border border-zinc-800/80">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">পয়দা / জন্ম মুহূর্ত:</span>
              <p data-testid="canonical-birth" className="mt-1 text-lg sm:text-xl font-display text-emerald-400">
                &ldquo;{DHAKAIYA_VOICE_GUIDE.canonicalLines.birth}&rdquo;
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950/80 p-4 border border-zinc-800/80">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">পয়লা ডাক / চয়েস মুহূর্ত:</span>
              <p data-testid="canonical-first-call" className="mt-1 text-base sm:text-lg font-body text-zinc-200">
                &ldquo;{DHAKAIYA_VOICE_GUIDE.canonicalLines.firstCall}&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Complex Conjuncts Grid */}
        <section
          data-testid="conjuncts-section"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur"
        >
          <div className="mb-4 flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-emerald-400 font-display">
              জটিল যুক্তাক্ষর ও স্বরচিহ্ন পরীক্ষা ({CONJUNCTS.length} টি যুক্তাক্ষর)
            </h2>
            <span className="text-xs text-zinc-400">সবগুলো যুক্তাক্ষর ভেঙে না গিয়ে যুক্তভাবে রেন্ডার হওয়া বাধ্যতামূলক</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {CONJUNCTS.map((c, i) => (
              <div
                key={i}
                data-testid={`conjunct-${i}`}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-center transition hover:border-emerald-500/40"
              >
                <span className="text-2xl font-bold text-white font-display">{c.char}</span>
                <span className="mt-1 text-sm font-semibold text-emerald-300 font-body">{c.example}</span>
                <span className="text-[11px] text-zinc-500 font-body">{c.meaning}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 20 Authentic Dhakaiya Sentences */}
        <section
          data-testid="sentences-section"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur space-y-6"
        >
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-rose-400 font-display">
              ২০টি যাচাইকৃত ঢাকাইয়া টেস্ট বাক্য (Dhakaiya Test Sentences)
            </h2>
            <p className="mt-1 text-xs text-zinc-400 font-body">
              নেটিভ স্পিকার দ্বারা ভেরিফাইড আসল ঢাকাইয়া কথ্য ডায়লগ ও যুক্তাক্ষর
            </p>
          </div>

          <div className="space-y-4">
            {DHAKAIYA_VOICE_GUIDE.sampleSentences.map((s, index) => (
              <article
                key={index}
                data-testid={`sentence-item-${index + 1}`}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition hover:border-zinc-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-400 border border-rose-500/20 font-display">
                    {index + 1}
                  </span>
                  <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-amber-300 font-display">
                    {s.category}
                  </span>
                </div>
                {/* Sentence in Display Font */}
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Baloo Da 2 (Display):</span>
                  <p
                    data-testid={`sentence-display-${index + 1}`}
                    className="text-base sm:text-lg font-bold text-zinc-100 font-display leading-relaxed"
                  >
                    {s.text}
                  </p>
                </div>
                {/* Sentence in Body Font */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Hind Siliguri (Body):</span>
                  <p
                    data-testid={`sentence-body-${index + 1}`}
                    className="text-sm sm:text-base font-normal text-zinc-300 font-body leading-relaxed"
                  >
                    {s.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Slang & Phrase Bank Showcase */}
        <section
          data-testid="slang-section"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur"
        >
          <div className="mb-4 border-b border-zinc-800 pb-3">
            <h2 className="text-xl font-bold text-sky-400 font-display">
              ঢাকাইয়া স্ল্যাং ও ফ্রেইজ ব্যাংক (Slang & Phrase Bank — {DHAKAIYA_VOICE_GUIDE.slangBank.length} Entries)
            </h2>
            <p className="mt-1 text-xs text-zinc-400 font-body">
              গেমের ইভেন্ট, সিদ্ধান্ত ও চয়েসের জন্য অনুমোদিত আসল ঢাকাইয়া শব্দভাণ্ডার
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DHAKAIYA_VOICE_GUIDE.slangBank.map((item, idx) => (
              <div
                key={idx}
                data-testid={`slang-item-${idx}`}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-1"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-sky-300 font-display">{item.term}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">({item.transliteration})</span>
                </div>
                <p className="text-xs text-zinc-400 font-body">{item.meaning}</p>
                <p className="mt-1 text-xs italic text-amber-200/90 font-body bg-zinc-900/90 p-1.5 rounded-lg border border-zinc-800">
                  &ldquo;{item.example}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Iconic Quotes */}
        <section
          data-testid="quotes-section"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur"
        >
          <h2 className="text-lg font-bold text-amber-300 font-display mb-3">
            আইকনিক গান ও ডায়লগ পাঞ্চলাইন (Audio & Punchlines)
          </h2>
          <ul className="space-y-2 text-sm text-amber-100/90 font-display">
            {DHAKAIYA_VOICE_GUIDE.iconicQuotes.map((q, i) => (
              <li key={i} data-testid={`quote-${i}`} className="flex items-center gap-2">
                <span className="text-amber-400">✦</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
