'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getJobBoard, careerTitle } from '@/lib/engine/events/categories/career';
import type { JobDef } from '@/lib/engine/events/categories/career';
import { CRIMES } from '@/lib/engine/events/categories/crime';
import { getFinance, LOAN_KIND_LABELS, netWorth, QUICK_BANK_AMOUNT } from '@/lib/engine/finance';
import { ASSET_CATALOG, ASSET_KIND_LABELS } from '@/lib/engine/events/catalog';
import { peerRelationships, type PeerRelation } from '@/lib/engine/relationships';
import { relLabel } from '@/lib/ui/relations';
import { jobLabel } from '@/lib/ui/jobs';
import { eligibleSubjects, SUBJECTS, type MajorField } from '@/lib/engine/events/categories/education';
import { PRESTIGE_LABELS, schoolsForStage, stageForAge } from '@/content/education/schools';
import type { SchoolDef } from '@/content/education/schools';
import { UNIVERSITIES, UNIVERSITY_PRESTIGE_LABELS } from '@/content/education/universities';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { Flame, UserPlus, CircleCheck, TriangleAlert } from 'lucide-react';
import type { AssetKind, Character, LoanKind } from '@/lib/engine/types';
import type { DatingCandidate } from '@/lib/engine/romance';

type Tab = 'school' | 'career' | 'romance' | 'assets' | 'crime' | 'health';

const TABS: { id: Tab; label: string }[] = [
  { id: 'school', label: 'পড়াশোনা' },
  { id: 'career', label: 'চাকরি ও রুজি' },
  { id: 'romance', label: 'প্রেম-ভালোবাসা' },
  { id: 'assets', label: 'সম্পদ ও ট্যাকা-পয়সা' },
  { id: 'crime', label: 'ধান্ধাবাজি' },
  { id: 'health', label: 'স্বাস্থ্য ও জীবনযাপন' },
];

export type { Tab };

const BUYABLE_KINDS: AssetKind[] = ['car', 'home', 'jewelry', 'collectible', 'stock', 'crypto'];

function coins(value: number): string {
  return value.toLocaleString();
}

/**
 * Active menu (DESIGN.md §2): age-unlocked deliberate actions that do not
 * advance the year. Each tap goes through the store's `runIdleAction`
 * harness, which keeps every outcome deterministic from the RNG state and
 * shows the result in the hub's message banner.
 */
export function ActiveMenu({
  open,
  onClose,
  initialTab = 'school',
}: {
  open: boolean;
  onClose: () => void;
  /** Preselected tab when the sheet is mounted fresh (remount per open). */
  initialTab?: Tab;
}) {
  const character = useGameStore((s) => s.character);
  const [tab, setTab] = useState<Tab>(initialTab);

  const actionMessage = useGameStore((s) => s.message);
  const actionRejection = useGameStore((s) => s.rejection);
  const feedbackText = actionMessage ?? actionRejection;

  const enrollHigherEducation = useGameStore((s) => s.enrollHigherEducation);
  const applyToSchool = useGameStore((s) => s.applyToSchool);
  const applyToUniversity = useGameStore((s) => s.applyToUniversity);
  const studyHarder = useGameStore((s) => s.studyHarder);
  const hireTutor = useGameStore((s) => s.hireTutor);
  const dropOutOfSchool = useGameStore((s) => s.dropOutOfSchool);
  const skipClass = useGameStore((s) => s.skipClass);
  const joinDebateClub = useGameStore((s) => s.joinDebateClub);

  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);
  const workOvertime = useGameStore((s) => s.workOvertime);
  const suckUpToBoss = useGameStore((s) => s.suckUpToBoss);
  const askForRaise = useGameStore((s) => s.askForRaise);
  const doSideHustle = useGameStore((s) => s.doSideHustle);

  const commitCrime = useGameStore((s) => s.commitCrime);
  const buyAsset = useGameStore((s) => s.buyAsset);
  const sellAsset = useGameStore((s) => s.sellAsset);
  const depositSavings = useGameStore((s) => s.depositSavings);
  const withdrawSavings = useGameStore((s) => s.withdrawSavings);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const repayLoan = useGameStore((s) => s.repayLoan);
  const declareBankruptcy = useGameStore((s) => s.declareBankruptcy);
  const visitDoctor = useGameStore((s) => s.visitDoctor);
  const visitKabiraj = useGameStore((s) => s.visitKabiraj);
  const doGymWorkout = useGameStore((s) => s.doGymWorkout);
  const watchMovie = useGameStore((s) => s.watchMovie);
  const prayOrWorship = useGameStore((s) => s.prayOrWorship);

  const getDatingCandidates = useGameStore((s) => s.getDatingCandidates);
  const askOut = useGameStore((s) => s.askOut);
  const makeOfficial = useGameStore((s) => s.makeOfficial);
  const propose = useGameStore((s) => s.propose);
  const breakupOrDivorce = useGameStore((s) => s.breakupOrDivorce);
  const datePartner = useGameStore((s) => s.datePartner);
  const giveGift = useGameStore((s) => s.giveGift);
  const haveBaby = useGameStore((s) => s.haveBaby);

  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  if (!character) return null;

  const board = getJobBoard(character);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay p-3 sm:p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro }}
          onClick={onClose}
          data-testid="active-menu-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-surface text-text shadow-2xl backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            data-testid="active-menu"
            role="dialog"
            aria-modal="true"
            aria-label="জীবনের নানা কাজ"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
<div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-base font-bold tracking-tight text-text">হাতেকলমে জীবনের ধান্ধা</h2>
                <p className="text-xs text-text-muted">পড়াশোনা, চাকরি, সম্পদ, রোমান্স ও যাবতীয় কারবার</p>
                <p className="mt-0.5 text-[11px] font-semibold text-primary-text">
                  এই বছরে বাকি কাজ: {Math.max(0, 3 - (character.activityBudgetUsed ?? 0))}টা / ৩টা
                </p>
              </div>
              <Button variant="secondary" onClick={onClose} data-testid="close-actions">
                বন্ধ করো
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-border bg-surface px-4 py-2.5" role="tablist">
              {TABS.map((tabDef) => (
                <button
                  key={tabDef.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === tabDef.id}
                  data-testid={`actions-tab-${tabDef.id}`}
                  onClick={() => setTab(tabDef.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.98] ${tab === tabDef.id
                      ? 'bg-primary text-on-primary'
                      : 'text-text-muted hover:bg-surface-raised hover:text-text'
                    }`}
                >
                  {tabDef.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <AnimatePresence mode="wait">
                {feedbackText && (
                  <motion.div
                    key={feedbackText}
                    role={actionMessage ? 'status' : 'alert'}
                    data-testid="actions-feedback"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
                    className={`mb-3 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium shadow-sm ${
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
              </AnimatePresence>

              {tab === 'school' && (
                <SchoolTab
                  character={character}
                  onEnroll={enrollHigherEducation}
                  onApplyUniversity={applyToUniversity}
                  onApplySchool={applyToSchool}
                  onStudyHarder={studyHarder}
                  onHireTutor={hireTutor}
                  onDropOut={dropOutOfSchool}
                  onSkipClass={skipClass}
                  onJoinDebateClub={joinDebateClub}
                />
              )}
              {tab === 'career' && (
                <CareerTab
                  character={character}
                  board={board}
                  onApply={applyForJob}
                  onQuit={quitJob}
                  onWorkOvertime={workOvertime}
                  onSuckUpToBoss={suckUpToBoss}
                  onAskForRaise={askForRaise}
                  onSideHustle={doSideHustle}
                />
              )}
              {tab === 'romance' && (
                <RomanceTab
                  character={character}
                  onAskOut={askOut}
                  onMakeOfficial={makeOfficial}
                  onPropose={propose}
                  onBreakup={breakupOrDivorce}
                  onGetCandidates={getDatingCandidates}
                  onDate={datePartner}
                  onGift={giveGift}
                  onHaveBaby={haveBaby}
                />
              )}
              {tab === 'assets' && (
                <AssetsTab
                  character={character}
                  onBuy={buyAsset}
                  onSell={sellAsset}
                  onDeposit={depositSavings}
                  onWithdraw={withdrawSavings}
                  onTakeLoan={takeLoan}
                  onRepayLoan={repayLoan}
                  onBankrupt={declareBankruptcy}
                />
              )}
              {tab === 'crime' && <CrimeTab character={character} onCommit={commitCrime} />}
              {tab === 'health' && (
                <HealthTab
                  character={character}
                  onVisitDoctor={visitDoctor}
                  onVisitKabiraj={visitKabiraj}
                  onDoGymWorkout={doGymWorkout}
                  onWatchMovie={watchMovie}
                  onPrayOrWorship={prayOrWorship}
                />
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const STAGE_LABELS: Record<string, string> = {
  none: 'শুরু হয় নাই',
  preschool: 'খেলাঘর / প্রাক-প্রাথমিক',
  elementary: 'প্রাথমিক বিদ্যালয়',
  middle: 'মাধ্যমিক বিদ্যালয়',
  high: 'উচ্চ বিদ্যালয়',
  undergraduate: 'বিশ্ববিদ্যালয়',
  graduate: 'স্নাতকোত্তর',
  vocational: 'পলিটেকনিক / কারিগরি',
  dropped: 'ড্রপআউট',
};

















/**
 * Life-sim-style peer cohort: classmates (study tab) and coworkers (job tab)
 * shown under হাতেকলমে জীবনের ধান্ধা instead of the classic relationship rail.
 * Inline actions reuse the shared interactWithPerson engine sink.
 */
function PeerCohort({ character, kind }: { character: Character; kind: PeerRelation }) {
  const interactWithPerson = useGameStore((s) => s.interactWithPerson);
  const peers = peerRelationships(character, kind);
  if (peers.length === 0) return null;

  const label = kind === 'classmate' ? 'সহপাঠীরা' : 'সহকর্মীরা';
  const hint =
    kind === 'classmate'
      ? 'স্কুল-কলেজের দৈনন্দিন সাথী — খাতির গড়লে এরা পরে পাকা বন্ধু হইতে পারে'
      : 'কাজের জায়গার মানুষ — সাথে তাল মিলাইলে জীবন আর রুজি দুইই সহজ';

return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4" data-testid={`peer-cohort-${kind}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-[11px] text-text-muted/80">{hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {peers.map((peer) => (
          <div
            key={peer.id}
            className="space-y-2 rounded-xl border border-border bg-surface-raised/60 p-3"
            data-testid={`peer-card-${peer.id}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text">{peer.name}</p>
                <p className="text-[11px] text-text-muted">
                  বয়স {peer.age}
                  {kind === 'coworker' && peer.jobId
                    ? ` · ${jobLabel(peer.jobId)}`
                    : ''}
                  {peer.relation !== kind ? ` · ${relLabel(peer.relation)}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[10px] uppercase tracking-wider text-text-muted">খাতির</span>
                <span className="font-mono text-xs font-bold text-primary-text">{peer.meter}%</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="secondary" onClick={() => interactWithPerson(peer.id, 'chat')} data-testid={`peer-${peer.id}-chat`} className="px-3 py-1.5 text-xs">
                আড্ডা মারা
              </Button>
              <Button variant="secondary" onClick={() => interactWithPerson(peer.id, 'spend_time')} data-testid={`peer-${peer.id}-hangout`} className="px-3 py-1.5 text-xs">
                লগে ঘুরা
              </Button>
              <Button variant="secondary" onClick={() => interactWithPerson(peer.id, 'gift')} data-testid={`peer-${peer.id}-gift`} className="px-3 py-1.5 text-xs">
                তোহফা দে
              </Button>
              <Button variant="secondary" onClick={() => interactWithPerson(peer.id, 'befriend')} data-testid={`peer-${peer.id}-befriend`} className="px-3 py-1.5 text-xs">
                বন্ধু বানাও
              </Button>
              {character.age >= 16 && (
                <Button variant="secondary" onClick={() => interactWithPerson(peer.id, 'ask_out_peer')} data-testid={`peer-${peer.id}-askout`} className="px-3 py-1.5 text-xs">
                  প্রেমের প্রস্তাব
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolTab({
  character,
  onEnroll,
  onApplySchool,
  onApplyUniversity,
  onStudyHarder,
  onHireTutor,
  onDropOut,
  onSkipClass,
  onJoinDebateClub,
}: {
  character: Character;
  onEnroll: (path: 'undergraduate' | 'vocational', major?: MajorField) => boolean;
  onApplySchool: (schoolId: string) => boolean;
  onApplyUniversity: (universityId: string, major?: MajorField) => boolean;
  onStudyHarder: () => boolean;
  onHireTutor: () => boolean;
  onDropOut: () => boolean;
  onSkipClass: () => boolean;
  onJoinDebateClub: () => boolean;
}) {
  const education = character.education;
  const schoolDone = character.age >= 18;
  const stageName = STAGE_LABELS[education.stage] ?? education.stage;
  const currentStage = stageForAge(character.age);
  const availableSchools = currentStage ? schoolsForStage(currentStage) : [];
  const subjects = eligibleSubjects(character);
  const [selectedSubject, setSelectedSubject] = useState<MajorField | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
        <p className="text-sm text-text">
          ধাপ: <span className="font-medium text-text">{stageName}</span> · জিপিএ{' '}
          <span className="font-bold text-tone-text-good font-mono">{education.gpa.toFixed(1)}</span>
          {education.graduated ? ' · পাস করছত' : ''}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {education.enrolled
            ? education.school
              ? `${education.school.name}তে পড়তাছো — এহন ইসকুল-কলেজের নজরকাড়া নাম!`
              : 'নিয়মিত শিক্ষাপ্রতিষ্ঠানে পড়াশোনা চলতাছে।'
            : education.graduated
              ? 'পড়াশোনার পাট তো চুকাইয়া ফেলছত, এহন আর স্কুল-কলেজে যাওয়ার কাম নাই!'
              : education.stage === 'dropped'
                ? 'পড়াশোনা ছাইড়া দিয়া এহন মুক্ত বিহঙ্গের লাহান ঘুরতাছো!'
                : 'পড়াশোনায় ভর্তি নাই।'}
        </p>
      </div>

      {currentStage && !education.graduated && education.stage !== 'dropped' && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">স্কুল বাছাও</p>
            <p className="text-[11px] text-text-muted/70">
              নামকরা স্কুলে পড়লে বুদ্ধি বেশি বাড়ে, কিন্তু ভর্তি-পরীক্ষা ও ফি-র চ্যালেঞ্জ আছে!
            </p>
          </div>
          <div className="space-y-2">
            {availableSchools.map((school: SchoolDef) => {
              const blocked =
                education.school?.id === school.id ||
                (school.minSmarts !== undefined && character.stats.smarts < school.minSmarts) ||
                character.money < school.tuition;
              return (
                <div
                  key={school.id}
                  className="rounded-xl border border-border bg-surface-raised/50 p-3"
                  data-testid={`school-card-${school.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{school.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {school.area} · {PRESTIGE_LABELS[school.prestige]}
                        {school.tuition > 0 ? ` · ফি ৳${school.tuition}` : ' · ফ্রি'}
                        {school.minSmarts !== undefined ? ` · বুদ্ধি ${school.minSmarts}+ লাগে` : ''}
                      </p>
                    </div>
                    <Button
                      variant={blocked ? 'secondary' : 'primary'}
                      disabled={blocked}
                      onClick={() => onApplySchool(school.id)}
                      data-testid={`apply-school-${school.id}`}
                    >
                      {education.school?.id === school.id ? 'পড়তাছো' : 'ভর্তি হই'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {education.enrolled && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">পড়াশোনার বিশেষ কারবার</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onStudyHarder} data-testid="study-harder">
              পড়াশোনায় জান দেওয়া (জিপিএ ও বুদ্ধি +)
            </Button>
            <Button variant="secondary" onClick={onHireTutor} data-testid="hire-tutor">
              প্রাইভেট টিউটর ধরা (৳৫০০)
            </Button>
            {character.age >= 10 && (
              <Button variant="secondary" onClick={onJoinDebateClub} data-testid="join-debate-club">
                বিতর্ক ক্লাবে ভর্তি হওয়া (৳১০০)
              </Button>
            )}
            <Button variant="secondary" onClick={onSkipClass} data-testid="skip-class">
              ক্লাস বাংক মারা
            </Button>
            <Button variant="danger" onClick={onDropOut} data-testid="drop-out">
              ইশকুল থিকা ভাগা (ড্রপআউট)
            </Button>
          </div>
        </div>
      )}

      {!education.enrolled && !education.graduated && schoolDone && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">উচ্চশিক্ষায় ভর্তি</p>
          <p className="text-[11px] text-text-muted/70">
            তোমার বুদ্ধি {character.stats.smarts} — নিচের বিষয়গুলোর মাঝে বাছাও (উপরে বুদ্ধি মান থাকলে শুধু ওইগুলাই চলে)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SUBJECTS) as MajorField[]).map((m) => {
              const eligible = subjects.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!eligible}
                  onClick={() => setSelectedSubject(selectedSubject === m ? null : m)}
                  data-testid={`subject-${m}`}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${selectedSubject === m
                      ? 'bg-primary text-on-primary'
                      : eligible
                        ? 'bg-surface-raised/70 text-text hover:bg-surface-raised'
                        : 'bg-surface text-text-muted/60 line-through'
                    }`}
                >
                  {SUBJECTS[m].label} · {SUBJECTS[m].institute} ({SUBJECTS[m].minSmarts}+)
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted/70">
            ভার্সিটি বাছাও — সরকারি ভার্সিটিগুলো ফ্রি, প্রাইভেটে ফি লাগে; নামকরা হতে হলে বুদ্ধির ঘাটতি মানা মুশকিল!
          </p>
          <div className="space-y-2">
            {UNIVERSITIES.map((uni) => {
              const blocked =
                (selectedSubject && uni.majors && !uni.majors.includes(selectedSubject)) ||
                (uni.minSmarts !== undefined && character.stats.smarts < uni.minSmarts) ||
                character.money < uni.tuition;
              const missingMajor = selectedSubject && uni.majors && !uni.majors.includes(selectedSubject);
              return (
                <div
                  key={uni.id}
                  className={`rounded-xl border p-3 ${blocked
                      ? 'border-border/60 bg-surface/40 opacity-70'
                      : 'border-border bg-surface-raised/50'}`}
                  data-testid={`university-card-${uni.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{uni.name}</p>
                      <p className="text-xs text-text-muted">
                        {uni.area} · {UNIVERSITY_PRESTIGE_LABELS[uni.prestige]}
                        {uni.tuition > 0 ? ` · ফি ৳${uni.tuition}` : ' · ফ্রি'}
                        {uni.minSmarts !== undefined ? ` · বুদ্ধি ${uni.minSmarts}+ লাগে` : ''}
                        {uni.majors ? ` · ${uni.majors.map((m) => SUBJECTS[m].label.split(' ')[0]).join(', ')}` : ''}
                      </p>
                    </div>
                    {missingMajor && (
                      <p className="shrink-0 text-[11px] text-tone-text-bad">এই সাবজেক্ট এখানে নাই</p>
                    )}
                    {!missingMajor && (
                      <Button
                      disabled={blocked}
                      onClick={() => onApplyUniversity(uni.id, selectedSubject ?? undefined)}
                      data-testid={`apply-university-${uni.id}`}
                    >
                      ভর্তি হই
                    </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onEnroll('vocational')} data-testid="enroll-vocational">
              কারিগরি ট্রেডে ভর্তি হও (৳২৫০)
            </Button>
          </div>
        </div>
      )}

      <PeerCohort character={character} kind="classmate" />
    </div>
  );
}

function CareerTab({
  character,
  board,
  onApply,
  onQuit,
  onWorkOvertime,
  onSuckUpToBoss,
  onAskForRaise,
  onSideHustle,
}: {
  character: Character;
  board: readonly JobDef[];
  onApply: (jobId: string) => boolean;
  onQuit: () => boolean;
  onWorkOvertime: () => boolean;
  onSuckUpToBoss: () => boolean;
  onAskForRaise: () => boolean;
  onSideHustle: (kind: 'tuition' | 'delivery' | 'street_vendor') => boolean;
}) {
  const career = character.career;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
        <p className="text-sm text-text">
          {career.jobId ? (
            <>
              বর্তমান পদ:{' '}
              <span className="font-bold text-text">{careerTitle(character)}</span>{' '}
              · চাকুরির বয়স <span className="font-mono text-text">{career.yearsAtJob}</span> বছর · পারফরম্যান্স{' '}
              <span className="font-mono font-bold text-tone-text-good">{career.performance}%</span>
            </>
          ) : (
            'বেকার বইসা আছত — নিচের রুজির তালিকা থেইকা কোনো কাম বেছে নেও।'
          )}
        </p>
      </div>

      {career.jobId && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">চাকরির বিশেষ কাজকর্ম</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onWorkOvertime} data-testid="work-overtime">
              ওভারটাইম খাটা (পারফরম্যান্স +১৫)
            </Button>
            <Button variant="secondary" onClick={onSuckUpToBoss} data-testid="suck-up-boss">
              বসকে তেল মারা (খাতির জমানো)
            </Button>
            <Button variant="secondary" onClick={onAskForRaise} data-testid="ask-for-raise">
              বেতন বাড়ানোর দরখাস্ত (Raise)
            </Button>
            <Button variant="danger" onClick={onQuit} data-testid="quit-job">
              চাকরি ছাড়মু (ইস্তফা)
            </Button>
          </div>
        </div>
      )}

      {character.age >= 13 && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            সাইড হাসল ও পার্টটাইম রুজি-রোজগার
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onSideHustle('tuition')} data-testid="side-hustle-tuition">
              ছাত্র পড়ানো / টিউশনি (মেধা ৪০+ লাগবে)
            </Button>
            <Button variant="secondary" onClick={() => onSideHustle('delivery')} data-testid="side-hustle-delivery">
              ফুড ও পার্সেল ডেলিভারি (সাইকেল নিয়া ধান্ধা)
            </Button>
            <Button variant="secondary" onClick={() => onSideHustle('street_vendor')} data-testid="side-hustle-vendor">
              চকবাজারের মোড়ে ভ্যানে খাবার বিক্রি
            </Button>
          </div>
        </div>
      )}
      {board.length === 0 ? (
        <p className="text-sm text-text-muted">তোর যোগ্যতার কোনো কাম এহন খালি নাই।</p>
      ) : (
        <ul className="space-y-2">
          {board.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 transition-transform active:scale-[0.98]"
              data-testid={`job-row-${job.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{job.title}</p>
                <p className="text-xs text-text-muted">
                  ≈৳{coins((job.salary[0] + job.salary[1]) / 2)} / বছর · বয়স {job.minAge}+
                </p>
              </div>
              <Button variant="secondary" onClick={() => onApply(job.id)} data-testid={`job-${job.id}`}>
                আবেদন করো
              </Button>
            </li>
          ))}
        </ul>
      )}

      <PeerCohort character={character} kind="coworker" />
    </div>
  );
}

function AssetsTab({
  character,
  onBuy,
  onSell,
  onDeposit,
  onWithdraw,
  onTakeLoan,
  onRepayLoan,
  onBankrupt,
}: {
  character: Character;
  onBuy: (kind: AssetKind, options?: { name?: string; price?: number }) => boolean;
  onSell: (assetId: string) => boolean;
  onDeposit: (amount: number) => boolean;
  onWithdraw: (amount: number) => boolean;
  onTakeLoan: (amount: number, kind: LoanKind) => boolean;
  onRepayLoan: (loanId: string) => boolean;
  onBankrupt: () => boolean;
}) {
  const finance = getFinance(character);
  const worth = netWorth(character);
  const insolvent = worth < 0;
  const [listingKind, setListingKind] = useState<AssetKind | null>(null);
  const list = listingKind ? ASSET_CATALOG[listingKind] : null;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
        <p className="text-sm text-text">
          হাতে-পকেটে: <span className="font-medium">৳{coins(character.money)}</span> · সঞ্চয়:{' '}
          <span className="font-medium">৳{coins(finance.savings)}</span>
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          সর্বমোট সম্পত্তি (মোট ট্যাকা − ধার): <span className="font-medium text-text">৳{coins(worth)}</span>
        </p>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">ব্যাংক সঞ্চয় (বার্ষিক সুদ ৪%)</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onDeposit(QUICK_BANK_AMOUNT)} data-testid="bank-deposit">
            সঞ্চয়ে জমাও ৳{QUICK_BANK_AMOUNT.toLocaleString()}
          </Button>
          <Button variant="secondary" onClick={() => onWithdraw(QUICK_BANK_AMOUNT)} data-testid="bank-withdraw">
            সঞ্চয় থেকে তোলো ৳{QUICK_BANK_AMOUNT.toLocaleString()}
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">ঋণ / ধার</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onTakeLoan(100_000, 'personal')} data-testid="take-loan">
            ব্যক্তিগত ঋণ নাও ৳100,000 (সোদ)
          </Button>
        </div>
        {finance.loans.length > 0 && (
          <ul className="mt-2 space-y-2">
            {finance.loans.map((loan) => (
              <li
                key={loan.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{LOAN_KIND_LABELS[loan.kind]}</p>
                  <p className="text-xs text-text-muted">
                    বাকি ৳{coins(loan.balance)} · {loan.takenAge} বছর বয়সে নেওয়া
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onRepayLoan(loan.id)} data-testid={`repay-${loan.id}`}>
                  শোধ করো
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-danger-border bg-danger/10 p-3">
        <p className="text-sm text-danger-text">
          {insolvent
            ? 'তোদের মোট ট্যাকা ঋণের তুলনায় নেতিবাচক — দেউলিয়া ঘোষণা দিলে সম্পত্তি বাজেয়াপ্ত হয়ে ধার মাফ হয়।'
            : 'সচ্ছল অবস্থায় আদালত দেউলিয়া ঘোষণা মানাবে না — ঋণে ডুবলে ফিরে আইসো।'}
        </p>
        <Button variant="danger" onClick={onBankrupt} data-testid="declare-bankruptcy" className="mt-2 w-full justify-center">
          দেউলিয়া ঘোষণা
        </Button>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">কিনাকাটা</p>
        {!list ? (
          <div className="grid grid-cols-2 gap-2">
            {BUYABLE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setListingKind(kind)}
                data-testid={`kind-${kind}`}
                className="rounded-xl border border-border bg-surface-raised/60 px-3 py-2.5 text-left text-sm font-medium text-text hover:bg-surface-raised hover:border-primary/40 transition-all"
              >
                {ASSET_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text">{ASSET_KIND_LABELS[listingKind!]}</p>
              <button
                type="button"
                onClick={() => setListingKind(null)}
                data-testid="catalog-back"
                className="text-xs font-semibold text-primary-text hover:underline"
              >
                ← বাজারে ফেরো
              </button>
            </div>
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{item.name}</p>
                  <p className="text-xs text-text-muted">
                    দাম ৳{coins(item.price)}
                    {character.money < item.price && (
                      <span className="text-danger-text"> · পকেটে ট্যাকা কম!</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onBuy(item.kind, { name: item.name, price: item.price });
                    setListingKind(null);
                  }}
                  data-testid={`buy-${item.id}`}
                >
                  কিনো
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">নিজের সম্পদ</p>
        {character.assets.length === 0 ? (
          <p className="text-sm text-text-muted">হাতে এখনো কিছু নাই — বাজারে ট্যাকা নিয়া নামো!</p>
        ) : (
          <ul className="space-y-2">
            {character.assets.map((asset) => (
              <li
                key={asset.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{asset.name}</p>
                  <p className="text-xs text-text-muted">
                    {ASSET_KIND_LABELS[asset.kind] ?? asset.kind} · দাম ৳{coins(asset.value)} · {asset.acquiredAge} বছর বয়সে কেনা
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onSell(asset.id)} data-testid={`sell-${asset.id}`}>
                  বেচে দাও
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CrimeTab({
  character,
  onCommit,
}: {
  character: Character;
  onCommit: (crimeId: string) => boolean;
}) {
  const inJail = character.flags.includes('in_jail');
  const crimeLockedByAge = character.age < 10;
  const bailOut = useGameStore((s) => s.bailOut);
  const prisonGym = useGameStore((s) => s.prisonGym);
  const prisonLibrary = useGameStore((s) => s.prisonLibrary);
  const prisonFight = useGameStore((s) => s.prisonFight);
  const prisonGoodBehavior = useGameStore((s) => s.prisonGoodBehavior);
  const prisonEscape = useGameStore((s) => s.prisonEscape);
  const prisonActions = inJail
    ? [
      { id: 'prison-gym', label: 'জিমে কসরত (স্বাস্থ্য ও হিম্মত বাড়ে)', action: prisonGym },
      { id: 'prison-library', label: 'জেল পুস্তকালয়ে পড়াশোনা (বুদ্ধি বাড়ে)', action: prisonLibrary },
      { id: 'prison-fight', label: 'কয়েদির লগে ঝাঁঝা ঝাঁঝা (হিম্মত ±)', action: prisonFight },
      { id: 'prison-good-behavior', label: 'সদাচরণ — প্যারোল/সাজা হ্রাস', action: prisonGoodBehavior },
      { id: 'prison-escape', label: 'রাতের অন্ধকারে পালানোর ফন্দি (বিটার ঝুঁকি!)', action: prisonEscape },
      { id: 'prison-bail', label: 'জামিন / আপস — টাকা দিয়া খালাস', action: bailOut },
    ]
    : [];

  return (
    <div className="space-y-3">
      {crimeLockedByAge && (
        <div className="rounded-2xl border border-tone-neutral/30 bg-tone-neutral/10 p-3 text-sm text-tone-text-neutral" role="status" data-testid="crime-age-lock">
          অপরাধের কারবারে নামার আগে অন্তত ১০ বছর বয়স হইতে হবে।
        </div>
      )}
      {inJail && (
        <div className="space-y-2 rounded-md border border-danger-border bg-danger/10 p-3">
          <p className="text-sm text-danger-text">
            তুই এহন লাল দালানে (জেলে) বন্দি আছত — সাজা খাটা শেষে খালাস পাবি। সেল ছাড়া বাইরে নতুন কোনো ধান্ধা করন যাইবো না।
          </p>
          <ul className="space-y-1.5">
            {prisonActions.map((item) => (
              <li key={item.id}>
                <Button
                  variant={item.id === 'prison-escape' ? 'danger' : 'secondary'}
                  onClick={() => item.action()}
                  data-testid={item.id}
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="space-y-2">
        {CRIMES.map((crime) => (
          <li key={crime.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 transition-transform active:scale-[0.98]">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{crime.label}</p>
              <p className="text-xs text-text-muted">
                লাভ ≈৳{coins((crime.reward[0] + crime.reward[1]) / 2)} · ধরা খাওয়ার রিস্ক {Math.round(crime.risk * 100)}%
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => onCommit(crime.id)}
              disabled={inJail || crimeLockedByAge}
              data-testid={`crime-${crime.id}`}
            >
              ঝুঁকি নেও
            </Button>
          </li>
        ))}
      </ul>
      {character.criminalRecord.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">পুলিশের খাতার রেকর্ড</p>
          <ul className="space-y-1 text-sm text-text-muted">
            {character.criminalRecord.map((entry, index) => {
              const crimeDef = CRIMES.find((c) => c.id === entry.offense);
              const offenseTitle = crimeDef ? crimeDef.label : entry.offense;
              return (
                <li key={`${entry.offense}-${entry.age}-${index}`}>
                  {entry.age} বছর বয়সে · {offenseTitle} · {entry.served ? 'জেল খাটা শেষ' : `আরো ${entry.sentenceYears} বছর বাকি`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function HealthTab({
  character,
  onVisitDoctor,
  onVisitKabiraj,
  onDoGymWorkout,
  onWatchMovie,
  onPrayOrWorship,
}: {
  character: Character;
  onVisitDoctor: () => boolean;
  onVisitKabiraj: () => boolean;
  onDoGymWorkout: () => boolean;
  onWatchMovie: () => boolean;
  onPrayOrWorship: () => boolean;
}) {
  const isMuslim = character.religion === 'islam';
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
        <p className="text-sm text-text">
          স্বাস্থ্য <span className="font-bold text-primary-text font-mono">{character.stats.health}%</span> · সুখ{' '}
          <span className="font-bold text-tone-text-neutral font-mono">{character.stats.happiness}%</span> · চেহারা{' '}
          <span className="font-bold text-tone-text-good font-mono">{character.stats.looks}%</span> · কর্ম{' '}
          <span className="font-bold text-tone-text-funny font-mono">{character.reputation.karma}%</span>
        </p>
      </div>

      {/* 1. Healing & Treatment */}
      <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">চিকিৎসা ও নিরাময়</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onVisitDoctor} data-testid="visit-doctor">
            ডাক্তারখানায় দেখাও (স্বাস্থ্য +১৫, সুখ +৫, −৳৫০)
          </Button>
          <Button variant="secondary" onClick={onVisitKabiraj} data-testid="visit-kabiraj">
            চকবাজারের কবিরাজ (ভেষজ দাওয়াই ও ঝাড়ফুঁক, −৳১০০)
          </Button>
        </div>
      </div>

      {/* 2. Fitness */}
      <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">শরীরচর্চা ও ফিটনেস</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onDoGymWorkout} data-testid="gym-workout">
            আখড়া ও বডিবিল্ডিং জিম (কসরত ও বুকডন, −৳১৫০)
          </Button>
        </div>
      </div>

      {/* 3. Entertainment */}
      <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">বিনোদন ও ফুর্তি</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onWatchMovie} data-testid="watch-movie">
            মধুমিতা সিনেমা হলে ছবি দেখা (সুখ +১৬, −৳২৫০)
          </Button>
        </div>
      </div>

      {/* 4. Spiritual & Faith */}
      <div className="space-y-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {isMuslim ? 'ইবাদত ও আধ্যাত্মিকতা' : 'পূজা-অর্চনা ও ধর্মীয় আচার'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onPrayOrWorship} data-testid="pray-worship">
            {isMuslim
              ? 'তারা মসজিদে জামাতে নামাজ ও খাস দোয়া (কর্ম ও সুখ বাড়বে)'
              : 'ঢাকেশ্বরী জাতীয় মন্দিরে পূজা ও পুষ্পাঞ্জলি (কর্ম ও সুখ বাড়বে)'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RomanceTab({
  character,
  onAskOut,
  onMakeOfficial,
  onPropose,
  onBreakup,
  onGetCandidates,
  onDate,
  onGift,
  onHaveBaby,
}: {
  character: Character;
  onAskOut: (candidate: DatingCandidate) => boolean;
  onMakeOfficial: (relationshipId: string) => boolean;
  onPropose: (relationshipId: string) => boolean;
  onBreakup: (relationshipId: string) => boolean;
  onGetCandidates: () => DatingCandidate[];
  onDate: (relationshipId: string) => boolean;
  onGift: (relationshipId: string) => boolean;
  onHaveBaby: (relationshipId: string) => boolean;
}) {
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (character.age < 16) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-border bg-surface-raised/40">
        <Flame className="size-8 text-tone-bad mb-3 opacity-60" />
        <h3 className="text-sm font-bold text-text">কৈশোরের দিনকাল</h3>
        <p className="text-xs text-text-muted max-w-xs mt-1.5 leading-relaxed">
          ১৬ বছর বয়স না হইলে সিরিয়াস প্রেম-পিরিতির ধান্ধা বন্ধ! এহন বন্ধুদের লগে আড্ডা মারো আর মন দিয়া পড়াশোনা করো।
        </p>
      </div>
    );
  }

  const romanticPartners = character.relationships.filter((r) =>
    ['crush', 'dating', 'partner', 'spouse'].includes(r.relation)
  );

  const handleSearch = () => {
    setCandidates(onGetCandidates());
    setHasSearched(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Relationships */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          বর্তমান প্রেম ও সম্পর্ক
        </h3>
        {romanticPartners.length === 0 ? (
          <p className="text-xs text-text-muted/80 py-2">
            তোর জীবনে এহন কোনো ক্রাশ বা ভালোবাসার মানুষ নাই!
          </p>
        ) : (
          <div className="space-y-2.5">
            {romanticPartners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-border bg-surface-raised/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text">{partner.name}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-tone-good/10 text-tone-text-good border border-tone-good/25">
                        {relLabel(partner.relation)}
                      </span>
                    </div>
<p className="text-xs text-text-muted mt-0.5">
                      বয়স {partner.age} {partner.occupation ? `· ${partner.occupation}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted block font-medium">খাতির</span>
                    <span className="text-xs font-bold text-primary-text font-mono">{partner.meter}%</span>
                  </div>
                </div>

                {/* Relational bond meter */}
                <div>
                  <div className="flex justify-between text-[10px] text-text-muted mb-1">
                    <span>প্রেমের গভীরতা</span>
                    <span className="font-mono">{partner.meter}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${partner.meter}%` }}
                    />
                  </div>
                </div>

                {/* Actions based on relationship state */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                  {partner.relation === 'crush' && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onAskOut({
                          id: partner.id,
                          name: partner.name,
                          gender: character.gender === 'male' ? 'female' : 'male',
                          age: partner.age,
                          archetype: partner.occupation || 'মহল্লার মানুষ',
                          isCelebrity: false,
                          looks: 50,
                          smarts: 50,
                        })
                      }
                      data-testid={`ask-out-${partner.id}`}
                    >
                      ডেট মারার প্রস্তাব দেও
                    </Button>
                  )}
                  {partner.relation === 'dating' && (
                    <Button
                      variant="secondary"
                      onClick={() => onMakeOfficial(partner.id)}
                      data-testid={`make-official-${partner.id}`}
                    >
                      মনের মানুষ বানাও (অফিশিয়াল)
                    </Button>
                  )}
                  {partner.relation === 'partner' && (
                    <Button
                      variant="primary"
                      onClick={() => onPropose(partner.id)}
                      data-testid={`propose-${partner.id}`}
                    >
                      বিয়ের প্রস্তাব দেও
                    </Button>
                  )}
                  {['dating', 'partner', 'spouse'].includes(partner.relation) && (
                    <Button
                      variant="secondary"
                      onClick={() => onDate(partner.id)}
                      data-testid={`date-${partner.id}`}
                    >
                      ডেট মারা (৳২০০)
                    </Button>
                  )}
                  {['dating', 'partner', 'spouse'].includes(partner.relation) && (
                    <Button
                      variant="secondary"
                      onClick={() => onGift(partner.id)}
                      data-testid={`gift-${partner.id}`}
                    >
                      তোহফা দেওয়া (৳৪০০)
                    </Button>
                  )}
                  {['partner', 'spouse'].includes(partner.relation) && character.age >= 18 && (
                    <Button
                      variant="secondary"
                      onClick={() => onHaveBaby(partner.id)}
                      data-testid={`baby-${partner.id}`}
                      className="bg-tone-good/10 text-tone-text-good border-tone-good/25 hover:bg-tone-good/20"
                    >
                      বাচ্চা নেওয়ার চেষ্টা
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => onBreakup(partner.id)}
                    data-testid={`breakup-${partner.id}`}
                    className="rounded-xl border border-danger-border bg-danger/10 hover:bg-danger/20 px-3 py-1.5 text-xs font-semibold text-danger-text transition-all duration-150 ml-auto active:scale-[0.98]"
                  >
                    {partner.relation === 'spouse' ? 'তালাক / বিচ্ছেদ' : 'ব্রেকআপ করো'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Meet Someone / Dating Candidates */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              নতুন কারো লগে পরিচয়
            </h3>
            <p className="text-xs text-text-muted/70">শহরের ও মহল্লার পাত্র-পাত্রীর খোঁজখবর</p>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            data-testid="search-dating-pool-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-tone-good/30 bg-tone-good/10 hover:bg-tone-good/20 px-3 py-1.5 text-xs font-bold text-tone-text-good transition-all duration-150 active:scale-[0.98]"
          >
            <UserPlus className="size-3.5" />
            <span>সন্ধান করো</span>
          </button>
        </div>

        {hasSearched && (
          <div className="space-y-2">
            {candidates.map((candidate, idx) => (
              <div
                key={`${candidate.name}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-3 hover:bg-surface-raised/70 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text">{candidate.name}</span>
                    <span className="text-[10px] text-text-muted">বয়স {candidate.age}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {candidate.archetype} · রূপ: {candidate.looks} · বুদ্ধি: {candidate.smarts}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onAskOut(candidate)}
                  data-testid={`candidate-askout-${idx}`}
                >
                  প্রস্তাব দেও
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}