'use client';

import { motion } from 'framer-motion';
import type { Relationship } from '@/lib/engine/types';
import { relLabel } from '@/lib/ui/relations';
import { isEstranged } from '@/lib/engine/relationships';
import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/Button';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { NpcChips } from '@/components/game/NpcChips';
import {
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
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';

interface RelationshipModalProps {
  relationship: Relationship | null;
  onClose: () => void;
}

export function RelationshipModal({ relationship, onClose }: RelationshipModalProps) {
  const character = useGameStore((s) => s.character);
  const actionMessage = useGameStore((s) => s.message);
  const actionRejection = useGameStore((s) => s.rejection);
  const feedbackText = actionMessage ?? actionRejection;

  const interactWithPerson = useGameStore((s) => s.interactWithPerson);
  const callEx = useGameStore((s) => s.callEx);
  const hookupEx = useGameStore((s) => s.hookupEx);
  const reuniteEx = useGameStore((s) => s.reuniteEx);
  const insultEx = useGameStore((s) => s.insultEx);
  const datePartner = useGameStore((s) => s.datePartner);
  const giveGift = useGameStore((s) => s.giveGift);
  const propose = useGameStore((s) => s.propose);
  const haveBaby = useGameStore((s) => s.haveBaby);
  const breakupOrDivorce = useGameStore((s) => s.breakupOrDivorce);
  const makeOfficial = useGameStore((s) => s.makeOfficial);

  if (!relationship || !character) return null;

  // Retrieve current live relationship object from store character
  const liveRel = character.relationships.find((r) => r.id === relationship.id) ?? relationship;
  const isEx = liveRel.relation === 'ex';
  const isPartner = liveRel.relation === 'partner' || liveRel.relation === 'dating';
  const isSpouse = liveRel.relation === 'spouse';

  const headerIcon = isEx ? <HeartCrack className="size-6" /> : isSpouse || isPartner ? <Heart className="size-6" /> : <UserCheck className="size-6" />;

  return (
    <ModalOverlay
      open={relationship !== null}
      onClose={onClose}
      id="relationship"
      title={liveRel.name}
      subtitle={`${relLabel(liveRel.relation)} · বয়স ${liveRel.age}${liveRel.occupation ? ` · ${liveRel.occupation}` : ''}`}
      icon={headerIcon}
      maxWidth="max-w-md"
      scrollable={false}
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            ফিরে যাও
          </Button>
        </div>
      }
    >
      <NpcChips
        health={liveRel.health}
        happiness={liveRel.happiness}
        jobId={liveRel.jobId}
        lastMetAge={liveRel.lastMetAge}
      />

      {/* Relationship Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-muted">খাতির ও আন্তরিকতা</span>
          <span className="font-mono font-bold text-primary-text">{liveRel.meter}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${liveRel.meter}%` }}
          />
        </div>
      </div>

      {/* Action Hub */}
      <div className="max-h-[50vh] space-y-4 overflow-y-auto">
        {feedbackText && (
          <motion.div
            key={feedbackText}
            role={actionMessage ? 'status' : 'alert'}
            data-testid="relationship-feedback"
            aria-live="polite"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium ${
              actionMessage
                ? 'border-tone-good/30 bg-tone-good/10 text-tone-text-good'
                : 'border-danger-border bg-danger/10 text-danger-text'
            }`}
          >
            {actionMessage ? (
              <CircleCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="leading-relaxed">{feedbackText}</span>
          </motion.div>
        )}

        {/* 1. EX-PARTNER ACTIONS */}
        {isEx && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              প্রাক্তন সংক্রান্ত কারবার
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => callEx(liveRel.id)}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Phone className="size-3.5 text-tone-neutral" />
                <span>ফোন / টেক্সট দেওয়া</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => hookupEx(liveRel.id)}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Flame className="size-3.5 text-tone-bad" />
                <span>গোপনে দেখা করা</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => reuniteEx(liveRel.id)}
                className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Heart className="size-3.5" />
                <span>পুরনো প্রেম জোড়া লাগানো</span>
              </Button>
              <Button
                variant="danger"
                onClick={() => insultEx(liveRel.id)}
                className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              সংসার ও ভালোবাসার বিশেষ পদক্ষেপ
            </p>
            <div className="grid grid-cols-2 gap-2">
              {liveRel.relation === 'dating' && (
                <Button
                  variant="primary"
                  onClick={() => makeOfficial(liveRel.id)}
                  data-testid={`make-official-modal-${liveRel.id}`}
                  className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
                >
                  <HeartHandshake className="size-3.5" />
                  মনের মানুষ বানাও (অফিশিয়াল)
                </Button>
              )}
              <Button variant="secondary" onClick={() => datePartner(liveRel.id)} className="py-2 text-xs">
                ডেট মারা (৳২০০)
              </Button>
              <Button variant="secondary" onClick={() => giveGift(liveRel.id)} className="py-2 text-xs">
                তোহফা দেওয়া (৳৪০০)
              </Button>
              {liveRel.relation === 'partner' && (
                <Button
                  variant="primary"
                  onClick={() => propose(liveRel.id, 'kazi_office')}
                  className="py-2 text-xs"
                >
                  কাজী অফিসে প্রস্তাব (৳২,০০০)
                </Button>
              )}
              {liveRel.relation === 'partner' && (
                <Button
                  variant="primary"
                  onClick={() => propose(liveRel.id, 'community_center')}
                  className="py-2 text-xs"
                >
                  কমিউনিটি সেন্টারে (৳৮,০০০)
                </Button>
              )}
              {character.age >= 18 && (
                <Button
                  variant="secondary"
                  onClick={() => haveBaby(liveRel.id)}
                  className="col-span-2 border-tone-good/40 py-2 text-xs text-tone-text-good"
                >
                  <Baby className="mr-1.5 inline size-3.5" />
                  বাচ্চা নেওয়ার চেষ্টা
                </Button>
              )}
              <button
                type="button"
                onClick={() => breakupOrDivorce(liveRel.id)}
                className="rounded-xl border border-danger-border bg-danger/10 py-2 text-xs font-semibold text-danger-text transition-all hover:bg-danger/20 active:scale-[0.98]"
              >
                {isSpouse ? 'তালাক / ডিভোর্স' : 'ব্রেকআপ'}
              </button>
            </div>
          </div>
        )}

        {/* 2.5 CHILD-RAISING ACTIONS */}
        {liveRel.relation === 'child' && liveRel.alive && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              সন্তান বড় করার কারবার
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'praise_child')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Trophy className="size-3.5 text-tone-good" />
                <span>বাহবা / তারিফ</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'child_treat')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Candy className="size-3.5 text-tone-good" />
                <span>মিষ্টি / খেলনা কিনা দেবে (৳১৫০)</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'discipline_child')}
                className="flex items-center justify-center gap-2 py-2 text-xs text-tone-text-bad"
              >
                <ShieldAlert className="size-3.5 text-tone-bad" />
                <span>শাসন করা</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'child_allowance')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Coins className="size-3.5 text-tone-good" />
                <span>পকেট খরচ দেওয়া</span>
              </Button>
            </div>
          </div>
        )}

        {/* 2.6 CLASSMATE / COWORKER ACTIONS */}
        {(liveRel.relation === 'classmate' || liveRel.relation === 'coworker') && liveRel.alive && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {liveRel.relation === 'classmate' ? (
                <GraduationCap className="size-3.5 text-tone-neutral" />
              ) : (
                <Briefcase className="size-3.5 text-tone-neutral" />
              )}
              {liveRel.relation === 'classmate' ? 'সহপাঠী সংক্রান্ত' : 'সহকর্মীর সংসার'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'befriend')}
                className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
              >
                <HeartHandshake className="size-3.5 text-tone-good" />
                <span>দোস্ত বানানোর চেষ্টা</span>
              </Button>
              {character.age >= 16 && (
                <Button
                  variant="secondary"
                  onClick={() => interactWithPerson(liveRel.id, 'ask_out_peer')}
                  className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs text-tone-text-good"
                >
                  <Heart className="size-3.5 text-tone-good" />
                  <span>প্রেমের প্রস্তাব (হাবি করা)</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 3. UNIVERSAL SOCIAL ACTIONS (For all alive non-ex or regular interactions) */}
        {!isEx && liveRel.alive && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              সামাজিক মেলামেশা
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'spend_time')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Sparkles className="size-3.5 text-tone-good" />
                <span>আড্ডা মারা (চা খাওয়া)</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'chat')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <MessageCircle className="size-3.5 text-tone-neutral" />
                <span>সুখ-দুঃখের আলাপ</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'compliment')}
                className="flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Smile className="size-3.5 text-tone-good" />
                <span>মাখন মারা (তারিফ)</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'insult')}
                className="flex items-center justify-center gap-2 py-2 text-xs text-tone-text-bad"
              >
                <AlertTriangle className="size-3.5 text-tone-bad" />
                <span>কথা শুনানো (ঝগড়া)</span>
              </Button>

              {/* Ask for money from parents, grandparents, spouse, or partner */}
              {['mother', 'father', 'grandparent', 'spouse', 'partner'].includes(liveRel.relation) &&
                liveRel.alive && (
                  <Button
                    variant="secondary"
                    onClick={() => interactWithPerson(liveRel.id, 'ask_money')}
                    className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
                  >
                    <Coins className="size-3.5 text-tone-good" />
                    <span>ট্যাকার আবদার (হাত পাতা)</span>
                  </Button>
                )}

              <Button
                variant="secondary"
                onClick={() => interactWithPerson(liveRel.id, 'gift')}
                className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs"
              >
                <Gift className="size-3.5 text-tone-funny" />
                <span>তোহফা দেওয়া (৳৩০০)</span>
              </Button>

              {isEstranged(liveRel) && (
                <Button
                  variant="secondary"
                  onClick={() => interactWithPerson(liveRel.id, 'make_peace')}
                  className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs text-tone-text-good"
                >
                  <HeartHandshake className="size-3.5 text-tone-good" />
                  <span>মিলন-মীমাংসা (শান্তি করা)</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}