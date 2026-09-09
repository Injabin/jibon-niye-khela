'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getJobBoard } from '@/lib/engine/events/categories/career';
import type { JobDef } from '@/lib/engine/events/categories/career';
import { CRIMES } from '@/lib/engine/events/categories/crime';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { Flame, UserPlus } from 'lucide-react';
import type { AssetKind, Character } from '@/lib/engine/types';
import type { DatingCandidate } from '@/lib/engine/romance';

type Tab = 'school' | 'career' | 'romance' | 'assets' | 'crime' | 'health';

const TABS: { id: Tab; label: string }[] = [
  { id: 'school', label: 'School' },
  { id: 'career', label: 'Career' },
  { id: 'romance', label: 'Romance' },
  { id: 'assets', label: 'Assets' },
  { id: 'crime', label: 'Crime' },
  { id: 'health', label: 'Health' },
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

  const enrollHigherEducation = useGameStore((s) => s.enrollHigherEducation);
  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);
  const commitCrime = useGameStore((s) => s.commitCrime);
  const buyAsset = useGameStore((s) => s.buyAsset);
  const sellAsset = useGameStore((s) => s.sellAsset);
  const visitDoctor = useGameStore((s) => s.visitDoctor);

  const getDatingCandidates = useGameStore((s) => s.getDatingCandidates);
  const askOut = useGameStore((s) => s.askOut);
  const makeOfficial = useGameStore((s) => s.makeOfficial);
  const propose = useGameStore((s) => s.propose);
  const cheat = useGameStore((s) => s.cheat);
  const breakupOrDivorce = useGameStore((s) => s.breakupOrDivorce);

  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  if (!character) return null;

  const education = character.education;
  const studying =
    education.enrolled && (education.stage === 'undergraduate' || education.stage === 'vocational');
  const board = getJobBoard(character);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro }}
          onClick={onClose}
          data-testid="active-menu-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/80 backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            data-testid="active-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Life actions"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">Activities & Pathways</h2>
                <p className="text-xs text-zinc-400">Pursue education, jobs, assets, and life choices</p>
              </div>
              <Button variant="secondary" onClick={onClose} data-testid="close-actions">
                Close
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5" role="tablist">
              {TABS.map((tabDef) => (
                <button
                  key={tabDef.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === tabDef.id}
                  data-testid={`actions-tab-${tabDef.id}`}
                  onClick={() => setTab(tabDef.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === tabDef.id
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:bg-surface-raised hover:text-text'
                  }`}
                >
                  {tabDef.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              {tab === 'school' && <SchoolTab character={character} studying={studying} onEnroll={enrollHigherEducation} />}
              {tab === 'career' && <CareerTab character={character} board={board} onApply={applyForJob} onQuit={quitJob} />}
              {tab === 'romance' && (
                <RomanceTab
                  character={character}
                  onAskOut={askOut}
                  onMakeOfficial={makeOfficial}
                  onPropose={propose}
                  onCheat={cheat}
                  onBreakup={breakupOrDivorce}
                  onGetCandidates={getDatingCandidates}
                />
              )}
              {tab === 'assets' && <AssetsTab character={character} onBuy={buyAsset} onSell={sellAsset} />}
              {tab === 'crime' && <CrimeTab character={character} onCommit={commitCrime} />}
              {tab === 'health' && <HealthTab character={character} onVisit={visitDoctor} />}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SchoolTab({
  character,
  studying,
  onEnroll,
}: {
  character: Character;
  studying: boolean;
  onEnroll: (path: 'undergraduate' | 'vocational') => boolean;
}) {
  const education = character.education;
  const schoolDone = character.age >= 18;
  return (
    <div className="space-y-3">
      <p className="text-sm text-text">
        Stage: <span className="font-medium">{education.stage}</span> · GPA{' '}
        {education.gpa.toFixed(1)}
        {education.graduated ? ' · graduated' : ''}
      </p>
      {studying ? (
        <p className="text-sm text-text-muted">You are currently enrolled. Graduation counts down with each passing year.</p>
      ) : education.graduated ? (
        <p className="text-sm text-text-muted">Your studying days are already done.</p>
      ) : !schoolDone ? (
        <p className="text-sm text-text-muted">School is not behind you yet — the classroom comes to you.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onEnroll('undergraduate')} data-testid="enroll-university">
            Attend university
          </Button>
          <Button variant="secondary" onClick={() => onEnroll('vocational')} data-testid="enroll-vocational">
            Vocational training
          </Button>
        </div>
      )}
    </div>
  );
}

function CareerTab({
  character,
  board,
  onApply,
  onQuit,
}: {
  character: Character;
  board: readonly JobDef[];
  onApply: (jobId: string) => boolean;
  onQuit: () => boolean;
}) {
  const career = character.career;
  return (
    <div className="space-y-3">
      <p className="text-sm text-text">
        {career.jobId ? (
          <>
            Currently:{' '}
            <span className="font-medium">
              {board.find((j) => j.id === career.jobId)?.title ?? career.jobId}
            </span>{' '}
            · year {career.yearsAtJob} · performance {career.performance}
          </>
        ) : (
          'Unemployed — the board is open below.'
        )}
      </p>
      {career.jobId && (
        <Button variant="danger" onClick={onQuit} data-testid="quit-job">
          Quit job
        </Button>
      )}
      {board.length === 0 ? (
        <p className="text-sm text-text-muted">Nothing posted that fits you yet.</p>
      ) : (
        <ul className="space-y-2">
          {board.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              data-testid={`job-row-${job.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{job.title}</p>
                <p className="text-xs text-text-muted">
                  ≈{coins((job.salary[0] + job.salary[1]) / 2)} / year · from {job.minAge}
                </p>
              </div>
              <Button variant="secondary" onClick={() => onApply(job.id)} data-testid={`job-${job.id}`}>
                Apply
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssetsTab({
  character,
  onBuy,
  onSell,
}: {
  character: Character;
  onBuy: (kind: AssetKind) => boolean;
  onSell: (assetId: string) => boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text">
        Coins: <span className="font-medium">{coins(character.money)}</span>
      </p>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">Buy</p>
        <div className="flex flex-wrap gap-2">
          {BUYABLE_KINDS.map((kind) => (
            <Button key={kind} variant="secondary" onClick={() => onBuy(kind)} data-testid={`buy-${kind}`}>
              {kind}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">Owned</p>
        {character.assets.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing yet — the market eyes you hopefully.</p>
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
                    {asset.kind} · worth {coins(asset.value)} · bought at {asset.acquiredAge}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onSell(asset.id)} data-testid={`sell-${asset.id}`}>
                  Sell
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
  return (
    <div className="space-y-3">
      {inJail && (
        <p className="rounded-md border border-danger-border bg-danger/10 px-3 py-2 text-sm text-danger-text">
          You are serving a sentence — no new crimes until release.
        </p>
      )}
      <ul className="space-y-2">
        {CRIMES.map((crime) => (
          <li key={crime.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{crime.label}</p>
              <p className="text-xs text-text-muted">
                reward ≈{coins((crime.reward[0] + crime.reward[1]) / 2)} · risk {Math.round(crime.risk * 100)}%
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => onCommit(crime.id)}
              disabled={inJail}
              data-testid={`crime-${crime.id}`}
            >
              Commit
            </Button>
          </li>
        ))}
      </ul>
      {character.criminalRecord.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">Record</p>
          <ul className="space-y-1 text-sm text-text-muted">
            {character.criminalRecord.map((entry, index) => (
              <li key={`${entry.offense}-${entry.age}-${index}`}>
                Age {entry.age} · {entry.offense} · {entry.served ? 'served' : `${entry.sentenceYears} yrs left`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HealthTab({ character, onVisit }: { character: Character; onVisit: () => boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text">
        Health <span className="font-medium">{character.stats.health}</span> · Happiness{' '}
        <span className="font-medium">{character.stats.happiness}</span>
      </p>
      <Button onClick={onVisit} data-testid="visit-doctor">
        Visit the doctor (health +15, happiness +5, −50 coins)
      </Button>
    </div>
  );
}

function RomanceTab({
  character,
  onAskOut,
  onMakeOfficial,
  onPropose,
  onCheat,
  onBreakup,
  onGetCandidates,
}: {
  character: Character;
  onAskOut: (candidate: DatingCandidate) => boolean;
  onMakeOfficial: (relationshipId: string) => boolean;
  onPropose: (relationshipId: string) => boolean;
  onCheat: (relationshipId: string) => boolean;
  onBreakup: (relationshipId: string) => boolean;
  onGetCandidates: () => DatingCandidate[];
}) {
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (character.age < 16) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
        <Flame className="size-8 text-rose-400 mb-3 opacity-60" />
        <h3 className="text-sm font-bold text-white">Youth & Adolescence</h3>
        <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
          Serious dating and relationships unlock at age 16. Enjoy your friendships, studies, and hobbies for now!
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Current Romance & Bonds
        </h3>
        {romanticPartners.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">
            You currently have no active romantic partners or crushes.
          </p>
        ) : (
          <div className="space-y-2.5">
            {romanticPartners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{partner.name}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/25">
                        {partner.relation}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Age {partner.age} {partner.occupation ? `· ${partner.occupation}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">Bond</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{partner.meter}%</span>
                  </div>
                </div>

                {/* Romance Stage meter if defined */}
                {partner.romanceStage !== undefined && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Romance Progress</span>
                      <span className="font-mono">{partner.romanceStage}/100</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all"
                        style={{ width: `${partner.romanceStage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions based on relationship state */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.05]">
                  {partner.relation === 'crush' && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onAskOut({
                          id: partner.id,
                          name: partner.name,
                          gender: 'female',
                          age: partner.age,
                          archetype: partner.occupation || 'Local Companion',
                          isCelebrity: false,
                          looks: 50,
                          smarts: 50,
                        })
                      }
                      data-testid={`ask-out-${partner.id}`}
                    >
                      Ask Out on Date
                    </Button>
                  )}
                  {partner.relation === 'dating' && (
                    <Button
                      variant="secondary"
                      onClick={() => onMakeOfficial(partner.id)}
                      data-testid={`make-official-${partner.id}`}
                    >
                      Make Official Partner
                    </Button>
                  )}
                  {partner.relation === 'partner' && (
                    <Button
                      variant="primary"
                      onClick={() => onPropose(partner.id)}
                      data-testid={`propose-${partner.id}`}
                    >
                      Propose Marriage
                    </Button>
                  )}
                  {(partner.relation === 'partner' || partner.relation === 'spouse') && (
                    <button
                      type="button"
                      onClick={() => onCheat(partner.id)}
                      data-testid={`cheat-${partner.id}`}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors"
                    >
                      Flirt with Danger
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onBreakup(partner.id)}
                    data-testid={`breakup-${partner.id}`}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors ml-auto"
                  >
                    {partner.relation === 'spouse' ? 'Divorce' : 'Break Up'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Meet Someone / Dating Candidates */}
      <div className="space-y-3 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Meet Someone New
            </h3>
            <p className="text-xs text-zinc-500">Explore procedurally generated dating prospects</p>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            data-testid="search-dating-pool-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors"
          >
            <UserPlus className="size-3.5" />
            <span>Search Pool</span>
          </button>
        </div>

        {hasSearched && (
          <div className="space-y-2">
            {candidates.map((candidate, idx) => (
              <div
                key={`${candidate.name}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{candidate.name}</span>
                    <span className="text-[10px] text-zinc-400">Age {candidate.age}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {candidate.archetype} · Looks: {candidate.looks} · Smarts: {candidate.smarts}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onAskOut(candidate)}
                  data-testid={`candidate-askout-${idx}`}
                >
                  Ask Out
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}