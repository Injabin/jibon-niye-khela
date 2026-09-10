'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Relationship } from '@/lib/engine/types';
import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/Button';
import { NpcChips } from '@/components/game/NpcChips';
import {
  X,
  Heart,
  MessageCircle,
  Sparkles,
  Phone,
  Flame,
  Coins,
  Gift,
  AlertTriangle,
  UserCheck,
  HeartCrack,
  Baby,
  Smile,
  Trophy,
  Candy,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  HeartHandshake,
} from 'lucide-react';

interface RelationshipModalProps {
  relationship: Relationship | null;
  onClose: () => void;
}

const RELATION_LABELS: Record<string, string> = {
  mother: 'আম্মা (মা)',
  father: 'আব্বা (বাবা)',
  sibling: 'ভাই / বোন',
  grandparent: 'দাদা / নানা',
  spouse: 'জীবনসঙ্গী (বউ/স্বামী)',
  partner: 'মনের মানুষ (পার্টনার)',
  dating: 'প্রেমের সম্পর্ক (ডেটিং)',
  crush: 'পছন্দের মানুষ (ক্রাশ)',
  ex: 'প্রাক্তন (সাবেক প্রেম)',
  child: 'সন্তান (ছেলে/মেয়ে)',
  friend: 'দোস্ত (বন্ধু)',
  classmate: 'সহপাঠী',
  coworker: 'সহকর্মী',
};

export function RelationshipModal({ relationship, onClose }: RelationshipModalProps) {
  const character = useGameStore((s) => s.character);
  const interactWithPerson = useGameStore((s) => s.interactWithPerson);
  const callEx = useGameStore((s) => s.callEx);
  const hookupEx = useGameStore((s) => s.hookupEx);
  const reuniteEx = useGameStore((s) => s.reuniteEx);
  const insultEx = useGameStore((s) => s.insultEx);
  const datePartner = useGameStore((s) => s.datePartner);
  const giveGift = useGameStore((s) => s.giveGift);
  const propose = useGameStore((s) => s.propose);
  const haveBaby = useGameStore((s) => s.haveBaby);
  const cheat = useGameStore((s) => s.cheat);
  const breakupOrDivorce = useGameStore((s) => s.breakupOrDivorce);

  if (!relationship || !character) return null;

  // Retrieve current live relationship object from store character
  const liveRel = character.relationships.find((r) => r.id === relationship.id) ?? relationship;
  const isEx = liveRel.relation === 'ex';
  const isPartner = liveRel.relation === 'partner' || liveRel.relation === 'dating';
  const isSpouse = liveRel.relation === 'spouse';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>

          {/* Person Header */}
          <div className="flex items-start gap-4 pb-5 border-b border-white/[0.08]">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 text-rose-400">
              {isEx ? (
                <HeartCrack className="size-6" />
              ) : isSpouse || isPartner ? (
                <Heart className="size-6" />
              ) : (
                <UserCheck className="size-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 id="relationship-modal-title" className="truncate text-lg font-bold text-white">
                  {liveRel.name}
                </h2>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                  {RELATION_LABELS[liveRel.relation] ?? liveRel.relation}
                </span>
              </div>
<p className="text-xs text-zinc-400 mt-0.5">
                বয়স {liveRel.age} বছর {liveRel.occupation ? `· ${liveRel.occupation}` : ''}
              </p>
              <NpcChips
                health={liveRel.health}
                happiness={liveRel.happiness}
                jobId={liveRel.jobId}
                lastMetAge={liveRel.lastMetAge}
              />
            </div>
          </div>

          {/* Relationship Meter */}
          <div className="py-4 space-y-2 border-b border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-400">খাতির ও আন্তরিকতা</span>
              <span className="font-mono font-bold text-emerald-400">{liveRel.meter}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${liveRel.meter}%` }}
              />
            </div>
          </div>

          {/* Action Hub */}
          <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-none">
            {/* 1. EX-PARTNER ACTIONS */}
            {isEx && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">প্রাক্তন সংক্রান্ত কারবার</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => callEx(liveRel.id)}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Phone className="size-3.5 text-sky-400" />
                    <span>ফোন / টেক্সট দেওয়া</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => hookupEx(liveRel.id)}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Flame className="size-3.5 text-amber-400" />
                    <span>গোপনে দেখা করা</span>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => reuniteEx(liveRel.id)}
                    className="flex items-center gap-2 justify-center text-xs py-2 col-span-2"
                  >
                    <Heart className="size-3.5 text-rose-300" />
                    <span>পুরনো প্রেম জোড়া লাগানো</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => insultEx(liveRel.id)}
                    className="flex items-center gap-2 justify-center text-xs py-2 col-span-2"
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>খোঁচা মারা / অপমান</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 2. PARTNER / SPOUSE ACTIONS */}
            {(isPartner || isSpouse) && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">সংসার ও ভালোবাসার বিশেষ পদক্ষেপ</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => datePartner(liveRel.id)}
                    className="text-xs py-2"
                  >
                    ডেট মারা (৳২০০)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => giveGift(liveRel.id)}
                    className="text-xs py-2"
                  >
                    তোহফা দেওয়া (৳৪০০)
                  </Button>
                  {isPartner && !isSpouse && (
                    <Button
                      variant="primary"
                      onClick={() => propose(liveRel.id, 'kazi_office')}
                      className="text-xs py-2"
                    >
                      কাজী অফিসে প্রস্তাব (৳২,০০০)
                    </Button>
                  )}
                  {isPartner && !isSpouse && (
                    <Button
                      variant="primary"
                      onClick={() => propose(liveRel.id, 'community_center')}
                      className="text-xs py-2 bg-amber-500/15 text-amber-300 border-amber-500/25 hover:bg-amber-500/25"
                    >
                      কমিউনিটি সেন্টারে (৳৮,০০০)
                    </Button>
                  )}
                  {character.age >= 18 && (
                    <Button
                      variant="secondary"
                      onClick={() => haveBaby(liveRel.id)}
                      className="text-xs py-2 col-span-2 bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                    >
                      <Baby className="size-3.5 inline mr-1.5" />
                      বাচ্চা নেওয়ার চেষ্টা
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => cheat(liveRel.id)}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 py-2 text-xs font-semibold text-amber-300 transition-colors"
                  >
                    পরকীয়ার চক্কর
                  </button>
                  <button
                    type="button"
                    onClick={() => breakupOrDivorce(liveRel.id)}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 py-2 text-xs font-semibold text-rose-300 transition-colors"
                  >
                    {isSpouse ? 'তালাক / ডিভোর্স' : 'ব্রেকআপ'}
                  </button>
                </div>
              </div>
            )}

            {/* 2.5 CHILD-RAISING ACTIONS */}
            {liveRel.relation === 'child' && liveRel.alive && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">সন্তান বড় করার কারবার</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'praise_child')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Trophy className="size-3.5 text-amber-400" />
                    <span>বাহবা / তারিফ</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'child_treat')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Candy className="size-3.5 text-rose-400" />
                    <span>মিষ্টি / খেলনা কিনা দেবে (৳১৫০)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'discipline_child')}
                    className="flex items-center gap-2 justify-center text-xs py-2 text-amber-300 hover:text-amber-200"
                  >
                    <ShieldAlert className="size-3.5 text-amber-400" />
                    <span>শাসন করা</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'child_allowance')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Coins className="size-3.5 text-yellow-400" />
                    <span>পকেট খরচ দেওয়া</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 2.6 CLASSMATE / COWORKER ACTIONS */}
            {(liveRel.relation === 'classmate' || liveRel.relation === 'coworker') && liveRel.alive && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  {liveRel.relation === 'classmate' ? (
                    <GraduationCap className="size-3.5" />
                  ) : (
                    <Briefcase className="size-3.5" />
                  )}
                  {liveRel.relation === 'classmate' ? 'সহপাঠী সংক্রান্ত' : 'সহকর্মীর সংসার'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'befriend')}
                    className="flex items-center gap-2 justify-center text-xs py-2 col-span-2"
                  >
                    <HeartHandshake className="size-3.5 text-emerald-400" />
                    <span>দোস্ত বানানোর চেষ্টা</span>
                  </Button>
                  {character.age >= 16 && (
                    <Button
                      variant="secondary"
                      onClick={() => interactWithPerson(liveRel.id, 'ask_out_peer')}
                      className="flex items-center gap-2 justify-center text-xs py-2 col-span-2 text-rose-300 hover:text-rose-200"
                    >
                      <Heart className="size-3.5 text-rose-400" />
                      <span>প্রেমের প্রস্তাব (হাবি করা)</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 3. UNIVERSAL SOCIAL ACTIONS (For all alive non-ex or regular interactions) */}
            {!isEx && liveRel.alive && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">সামাজিক মেলামেশা</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'spend_time')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span>আড্ডা মারা (চা খাওয়া)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'chat')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <MessageCircle className="size-3.5 text-teal-400" />
                    <span>সুখ-দুঃখের আলাপ</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'compliment')}
                    className="flex items-center gap-2 justify-center text-xs py-2"
                  >
                    <Smile className="size-3.5 text-emerald-400" />
                    <span>মাখন মারা (তারিফ)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'insult')}
                    className="flex items-center gap-2 justify-center text-xs py-2 text-rose-300 hover:text-rose-200"
                  >
                    <AlertTriangle className="size-3.5 text-rose-400" />
                    <span>কথা শুনানো (ঝগড়া)</span>
                  </Button>

                  {/* Ask for money from parents, grandparents, spouse, or partner */}
                  {['mother', 'father', 'grandparent', 'spouse', 'partner'].includes(liveRel.relation) && liveRel.alive && (
                    <Button
                      variant="secondary"
                      onClick={() => interactWithPerson(liveRel.id, 'ask_money')}
                      className="flex items-center gap-2 justify-center text-xs py-2 col-span-2"
                    >
                      <Coins className="size-3.5 text-yellow-400" />
                      <span>ট্যাকার আবদার (হাত পাতা)</span>
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'gift')}
                    className="flex items-center gap-2 justify-center text-xs py-2 col-span-2"
                  >
                    <Gift className="size-3.5 text-violet-400" />
                    <span>তোহফা দেওয়া (৳৩০০)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Close button at bottom */}
          <div className="pt-3 border-t border-white/[0.08] flex justify-end">
            <Button variant="secondary" onClick={onClose} className="text-xs">
              ফিরে যাও
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
