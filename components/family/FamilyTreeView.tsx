/**
 * Interactive family system (init.md M4 #3, DESIGN.md §7/§8):
 * - Primary interactive card-based Family List with rich Dhakaiya interactions:
 *   কাচ্চি খাওয়া (spend time), আড্ডা মারা (chitchat), মাখন মারা (compliment),
 *   ট্যাকা ধার চাওয়া (ask money), উপহার দেওয়া (gift)
 * - Secondary interactive family-tree SVG graph toggle with pan/zoom controls.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import { BOND_MAX, layoutFamilyTree, relationLabel } from '@/lib/engine/family';
import type { FamilyMember } from '@/lib/engine/family';
import { hapticForSfx } from '@/lib/haptics';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Coins, Gift, Heart, MessageCircle, Sparkles, User, Users, X } from 'lucide-react';

const SCENE_W = 800;
const SCENE_H = 560;

const NODE_FILL: Record<FamilyMember['role'], string> = {
  self: 'var(--color-tree-self)',
  mother: 'var(--color-tree-mother)',
  father: 'var(--color-tree-father)',
  grandparent: 'var(--color-tree-grandparent)',
  sibling: 'var(--color-tree-sibling)',
  spouse: 'var(--color-tree-spouse)',
  child: 'var(--color-tree-child)',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function clampZoom(zoom: number): number {
  return Math.min(2.4, Math.max(0.6, zoom));
}

export function FamilyTreeView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const character = useGameStore((s) => s.character);
  const familyTree = useGameStore((s) => s.familyTree);
  const spendTimeWith = useGameStore((s) => s.spendTimeWith);
  const interactWithFamily = useGameStore((s) => s.interactWithFamily);
  const reducedMotion = useEffectiveReducedMotion();

  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  const [activeView, setActiveView] = useState<'list' | 'graph'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const panStart = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const positions = useMemo(
    () => (familyTree ? layoutFamilyTree(familyTree) : new Map<string, { x: number; y: number }>()),
    [familyTree],
  );

  const selected = selectedId ? familyTree?.members.find((m) => m.id === selectedId) ?? null : null;

  if (!open) return null;
  if (!familyTree || !character) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="family-tree">
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text">No family yet — start a life.</p>
      </div>
    );
  }

  const canSpend =
    (selected?.role ?? 'self') !== 'self' &&
    selected !== null &&
    selected.bond < BOND_MAX &&
    selected.lastSpentAge !== character.age &&
    character.alive;

  const onPointerDown = (event: React.PointerEvent) => {
    panStart.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
    moved.current = false;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!panStart.current) return;
    const dx = event.clientX - panStart.current.x;
    const dy = event.clientY - panStart.current.y;
    if (!moved.current && Math.hypot(dx - pan.x, dy - pan.y) > 4) moved.current = true;
    setPan({ x: dx, y: dy });
  };

  const onPointerUp = () => {
    panStart.current = null;
  };

  const onNodeClick = (member: FamilyMember) => {
    if (moved.current) return;
    setSelectedId(member.id);
    setFeedback(null);
  };

  const onNodeKeyDown = (event: React.KeyboardEvent, member: FamilyMember) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNodeClick(member);
    }
  };

  return (
    <motion.div
      ref={overlayRef as React.Ref<HTMLDivElement>}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTokens.micro }}
      data-testid="family-tree"
      data-motion={reducedMotion ? 'static' : 'animated'}
      role="dialog"
      aria-modal="true"
      aria-label="Family tree"
      onKeyDown={trapKeyDown}
      tabIndex={-1}
    >
      <div className="relative flex h-full max-h-[660px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/80 backdrop-blur-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">পরিবার ও আত্মীয়স্বজন</h2>
              <p className="text-xs text-zinc-400">পুরান ঢাকার পরিবার ও মুরব্বিদের লগে খাতির</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setActiveView('list');
                  setFeedback(null);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  activeView === 'list'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                তালিকা ভিউ
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('graph');
                  setFeedback(null);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  activeView === 'graph'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                বংশলতিকা চিত্র
              </button>
            </div>

            {/* Zoom Controls for Graph & Accessibility */}
            <div className="flex items-center gap-1" data-testid="tree-zoom-controls">
              <Button
                variant="secondary"
                className="px-2 py-1 text-xs font-bold"
                onClick={() => {
                  setActiveView('graph');
                  setZoom((z) => clampZoom(z * 1.2));
                }}
                data-testid="tree-zoom-in"
                aria-label="Zoom in"
              >
                +
              </Button>
              <Button
                variant="secondary"
                className="px-2 py-1 text-xs font-bold"
                onClick={() => {
                  setActiveView('graph');
                  setZoom((z) => clampZoom(z * 0.8));
                }}
                data-testid="tree-zoom-out"
                aria-label="Zoom out"
              >
                −
              </Button>
              <Button
                variant="secondary"
                className="px-2 py-1 text-xs font-bold"
                onClick={() => {
                  setActiveView('graph');
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                data-testid="tree-reset"
                aria-label="Reset view"
              >
                ↺
              </Button>
            </div>

            <Button variant="secondary" onClick={onClose} data-testid="family-tree-close">
              বন্ধ করো
            </Button>
          </div>
        </header>

        {/* View 1: Primary Interactive Family List */}
        {activeView === 'list' && (
          <div className="relative flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            <div className="space-y-2.5">
              {familyTree.members.map((member) => {
                const isSelf = member.role === 'self';
                const isSelected = selectedId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(member.id);
                      setFeedback(null);
                      soundManager.play('button_press');
                    }}
                    data-testid={isSelf ? 'tree-node-self' : `tree-node-${member.role}`}
                    className={`w-full flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/20'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex size-11 items-center justify-center rounded-2xl font-bold text-sm text-white shadow-md"
                        style={{ backgroundColor: member.alive ? NODE_FILL[member.role] : 'var(--color-tree-deceased)' }}
                      >
                        {isSelf ? <User className="size-5" /> : initials(member.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{member.name}</span>
                          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-white/[0.05]">
                            {relationLabel(member)}
                          </span>
                          {!member.alive && (
                            <span className="rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20 px-2 py-0.5 text-[10px] font-medium">
                              স্বর্গবাসী
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          বয়স {member.age} বছর {isSelf ? '· (তুমি নিজে)' : ''}
                        </p>
                      </div>
                    </div>

                    {!isSelf && (
                      <div className="text-right min-w-[80px]">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                          <Heart className="size-3 text-rose-400 fill-rose-400" />
                          <span>{member.bond}%</span>
                        </div>
                        <div className="w-18 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5 ml-auto">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all"
                            style={{ width: `${member.bond}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* View 2: Secondary SVG Graph View */}
        {activeView === 'graph' && (
          <div
            className="relative min-h-0 flex-1 touch-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={(event) => {
              event.preventDefault();
              setZoom((z) => clampZoom(z * (event.deltaY > 0 ? 0.9 : 1.1)));
            }}
          >
            <svg
              viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
              className="h-full w-full"
              data-testid="tree-graph"
            >
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {familyTree.edges.map((edge) => {
                  const from = positions.get(edge.from);
                  const to = positions.get(edge.to);
                  if (!from || !to) return null;
                  const mx = (from.x + to.x) / 2;
                  const my = (from.y + to.y) / 2;
                  return (
                    <g key={`${edge.from}-${edge.to}`}>
                      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--color-tree-edge)" strokeWidth={2} />
                      <text x={mx} y={my - 8} textAnchor="middle" fontSize={11} fill="var(--color-tree-edge)">
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {familyTree.members.map((member, index) => {
                  const pos = positions.get(member.id);
                  if (!pos) return null;
                  const fill = member.alive ? NODE_FILL[member.role] : 'var(--color-tree-deceased)';
                  return (
                    <g key={member.id} transform={`translate(${pos.x} ${pos.y})`}>
                      <motion.g
                        onClick={() => onNodeClick(member)}
                        onKeyDown={(event) => onNodeKeyDown(event, member)}
                        style={{ cursor: 'pointer' }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${member.name}, ${relationLabel(member)}, ${member.alive ? 'alive' : 'deceased'}`}
                        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35 }}
                      >
                        <circle
                          r={26}
                          fill={fill}
                          stroke={selectedId === member.id ? 'var(--color-tree-selected)' : 'var(--color-tree-stroke)'}
                          strokeWidth={selectedId === member.id ? 4 : 2}
                          opacity={member.alive ? 1 : 0.75}
                        />
                        <text y={4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--color-tree-text-on-fill)">
                          {initials(member.name)}
                        </text>
                        <text y={40} textAnchor="middle" fontSize={12} fill="var(--color-text-muted)">
                          {relationLabel(member)}
                        </text>
                      </motion.g>
                    </g>
                  );
                })}
              </g>
            </svg>

          </div>
        )}

        {/* Selected Member Detail & Action Panel */}
        <AnimatePresence>
          {selected && (
            <motion.aside
              className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 rounded-2xl border border-white/10 bg-zinc-900/98 p-4 shadow-2xl shadow-black/90 backdrop-blur-2xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
              data-testid="tree-panel"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{selected.name}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400" data-testid="tree-relation">
                    {relationLabel(selected)} {selected.role === 'mother' ? '(Mother)' : selected.role === 'father' ? '(Father)' : ''} · বয়স {selected.age} · {selected.alive ? 'জীবিত (Alive)' : 'মৃত (Gone)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setFeedback(null);
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>খাতির ও টান (Bond)</span>
                  <span data-testid="tree-bond-value" className="font-mono font-bold text-emerald-400">{selected.bond}</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label="Bond"
                  aria-valuemin={0}
                  aria-valuemax={BOND_MAX}
                  aria-valuenow={selected.bond}
                  data-testid="tree-bond"
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${selected.bond}%` }} />
                </div>
              </div>

              {/* Feedback toast message */}
              {feedback && (
                <div className="mt-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-xs text-emerald-300 leading-relaxed">
                  {feedback}
                </div>
              )}

              {selected.role !== 'self' && (
                <div className="mt-3 space-y-2">
                  {/* Primary spend time button (tests & standard action) */}
                  <Button
                    variant="primary"
                    className="w-full px-3 py-2 text-xs font-bold"
                    disabled={!canSpend}
                    data-testid="tree-spend-time"
                    onClick={() => {
                      if (spendTimeWith(selected.id)) {
                        soundManager.play('button_press');
                        hapticForSfx('button_press');
                        setFeedback('নাজিরাবাজারের নান্নার বিরিয়ানিতে জমজমাট কাচ্চি খাওয়া হইলো! (+৮ খাতির)');
                      }
                    }}
                  >
                    {!selected.alive
                      ? 'উনি আর দুনিয়ায় নাই'
                      : selected.bond >= BOND_MAX
                        ? 'খাতির সর্বোচ্চ চূড়ায়'
                        : selected.lastSpentAge === character.age
                          ? 'এই বছর সময় কাটানো শেষ (Spent time this year)'
                          : 'কাচ্চি খাওয়া ও সময় কাটাও (+৮ খাতির)'}
                  </Button>

                  {/* Secondary funny Old Dhaka interactions */}
                  {selected.alive && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const res = interactWithFamily(selected.id, 'chitchat');
                        setFeedback(res.message);
                        soundManager.play('button_press');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors"
                    >
                      <MessageCircle className="size-3.5 text-sky-400 shrink-0" />
                      <span>আড্ডা মারা</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = interactWithFamily(selected.id, 'compliment');
                        setFeedback(res.message);
                        soundManager.play('button_press');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors"
                    >
                      <Sparkles className="size-3.5 text-amber-400 shrink-0" />
                      <span>মাখন মারা</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = interactWithFamily(selected.id, 'ask_money');
                        setFeedback(res.message);
                        soundManager.play('button_press');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors"
                    >
                      <Coins className="size-3.5 text-emerald-400 shrink-0" />
                      <span>ট্যাকা ধার চাওয়া</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = interactWithFamily(selected.id, 'gift');
                        setFeedback(res.message);
                        soundManager.play('button_press');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors"
                    >
                      <Gift className="size-3.5 text-rose-400 shrink-0" />
                      <span>উপহার দেওয়া</span>
                    </button>
                  </div>
                  )}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}