/**
 * Interactive family-tree graph (init.md M4 #3, DESIGN.md §7/§8) — the shipped
 * v1, not a placeholder: pan (drag/wheel-adjacent buttons) + zoom with reset,
 * gently floating/pulsing SVG nodes, and a tap-to-open relationship panel with
 * a bond meter and a "spend time" interaction (once per year, capped at 100).
 *
 * Lazy-loaded via `next/dynamic` from the hub so its chunk stays out of the
 * initial payload alongside the Lottie runtime.
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

const SCENE_W = 800;
const SCENE_H = 560;

const NODE_FILL: Record<FamilyMember['role'], string> = {
  self: '#7c9cff',
  mother: '#ef8aa8',
  father: '#5fb0e8',
  grandparent: '#a0aab8',
  sibling: '#f2b84b',
  spouse: '#4fc3a1',
  child: '#f2b84b',
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
  const reducedMotion = useEffectiveReducedMotion();

  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6"
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
      <div className="relative flex h-full max-h-[640px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-text">Family tree</h2>
            <p className="text-xs text-text-muted">Tap a node for their relationship panel</p>
          </div>
          <Button variant="secondary" onClick={onClose} data-testid="family-tree-close">
            Close
          </Button>
        </header>

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
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#8a94a6" strokeWidth={2} />
                    <text x={mx} y={my - 8} textAnchor="middle" fontSize={11} fill="#8a94a6">
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {familyTree.members.map((member, index) => {
                const pos = positions.get(member.id);
                if (!pos) return null;
                const isSelf = member.role === 'self';
                const fill = member.alive ? NODE_FILL[member.role] : '#b6bcc6';
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
                      data-testid={isSelf ? 'tree-node-self' : `tree-node-${member.role}`}
                      animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35 }}
                    >
                      <circle
                        r={26}
                        fill={fill}
                        stroke={selectedId === member.id ? '#ffd166' : '#fdfdf8'}
                        strokeWidth={selectedId === member.id ? 4 : 2}
                        opacity={member.alive ? 1 : 0.75}
                      />
                      <text y={4} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1c1917">
                        {initials(member.name)}
                      </text>
                      <text y={40} textAnchor="middle" fontSize={12} fill="#3d3a36">
                        {relationLabel(member)}
                      </text>
                    </motion.g>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute right-3 top-3 flex flex-col gap-1" data-testid="tree-zoom-controls">
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setZoom((z) => clampZoom(z * 1.2))} data-testid="tree-zoom-in" aria-label="Zoom in">
              +
            </Button>
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setZoom((z) => clampZoom(z * 0.8))} data-testid="tree-zoom-out" aria-label="Zoom out">
              −
            </Button>
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} data-testid="tree-reset" aria-label="Reset view">
              ↺
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.aside
              className="absolute bottom-3 right-3 w-64 rounded-lg border border-border bg-surface p-4 shadow-lg"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
              data-testid="tree-panel"
            >
              <h3 className="text-sm font-semibold text-text">{selected.name}</h3>
              <p className="mt-1 text-xs text-text-muted" data-testid="tree-relation">
                {relationLabel(selected)} · Age {selected.age} · {selected.alive ? 'Alive' : 'Gone'}
              </p>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-text-muted">
                  <span>Bond</span>
                  <span data-testid="tree-bond-value">{selected.bond}</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-label="Bond"
                  aria-valuemin={0}
                  aria-valuemax={BOND_MAX}
                  aria-valuenow={selected.bond}
                  data-testid="tree-bond"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${selected.bond}%` }} />
                </div>
              </div>

              {selected.role !== 'self' && (
                <Button
                  variant="secondary"
                  className="mt-3 w-full px-3 py-1.5 text-xs"
                  disabled={!canSpend}
                  data-testid="tree-spend-time"
                  onClick={() => {
                    if (spendTimeWith(selected.id)) {
                      soundManager.play('button_press');
                      hapticForSfx('button_press');
                    }
                  }}
                >
                  {selected.bond >= BOND_MAX
                    ? 'Bond at its strongest'
                    : selected.lastSpentAge === character.age
                      ? 'Spent time this year'
                      : 'Spend time (+8 bond)'}
                </Button>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}