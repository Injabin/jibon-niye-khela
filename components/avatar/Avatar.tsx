'use client';

import { useMemo } from 'react';
import { avatarVisualsFor } from '@/lib/avatar/palette';
import { expressionForTone } from '@/lib/engine/moments';
import { lifeStageForAge } from '@/lib/engine/life';
import type { Character } from '@/lib/engine/types';
import { useGameStore } from '@/lib/store/gameStore';
import { ExpressionOverlay } from './ExpressionOverlay';

const VIEW_W = 140;
const VIEW_H = 170;
const HEAD_CX = 70;
const HEAD_CY = 54;
const HEAD_BASE_R = 30;

/**
 * Layered 2D character portrait (DESIGN.md §2, §7): SVG base body + head per
 * life stage and gender, with an expression overlay on top.
 *
 * The avatar picks its palette from the pure `AVATAR_PALETTE` table. The
 * expression overlay follows the player's most recent choice tone
 * (`lastOutcomeTone`, DESIGN.md §6 point 1); `ExpressionOverlay` is keyed so
 * its animation restarts for each new outcome.
 */
export function Avatar({ character }: { character: Character }) {
  const lastOutcomeTone = useGameStore((s) => s.lastOutcomeTone);

  const stage = lifeStageForAge(character.age);
  const visuals = avatarVisualsFor(stage, character.gender);
  const headR = HEAD_BASE_R * visuals.headScale;
  const dead = !character.alive;

  const expression = useMemo(
    () => (lastOutcomeTone ? expressionForTone(lastOutcomeTone) : null),
    [lastOutcomeTone],
  );

  // Hair geometry for the different styles.
  const sideStrandHeight =
    visuals.hairStyle === 'long'
      ? headR * 1.18
      : visuals.hairStyle === 'bob'
        ? headR * 0.92
        : null;

  const capPath = [
    `M ${HEAD_CX - headR * 0.95} ${HEAD_CY - headR * 0.5}`,
    `Q ${HEAD_CX - headR * 0.95} ${HEAD_CY - headR} ${HEAD_CX} ${HEAD_CY - headR}`,
    `Q ${HEAD_CX + headR * 0.95} ${HEAD_CY - headR} ${HEAD_CX + headR * 0.95} ${HEAD_CY - headR * 0.5}`,
    `Q ${HEAD_CX + headR * 0.9} ${HEAD_CY - headR * 0.15} ${HEAD_CX + headR * 0.72} ${HEAD_CY - headR * 0.1}`,
    `Q ${HEAD_CX} ${HEAD_CY - headR * 0.28} ${HEAD_CX - headR * 0.72} ${HEAD_CY - headR * 0.1}`,
    `Q ${HEAD_CX - headR * 0.9} ${HEAD_CY - headR * 0.15} ${HEAD_CX - headR * 0.95} ${HEAD_CY - headR * 0.5}`,
    'Z',
  ].join(' ');

  const eyeOffset = headR * 0.42;
  const eyeR = Math.max(3.6, headR * 0.14);
  const eyeY = HEAD_CY + headR * 0.06;

  return (
    <div
      className="relative h-44 w-36 shrink-0"
      data-testid="avatar"
      data-stage={stage}
      data-gender={character.gender}
      data-dead={dead ? 'true' : 'false'}
      role="img"
      aria-label={`${character.name} ${character.surname}, ${stage} stage`}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        aria-hidden
        style={dead ? { opacity: 0.72, filter: 'grayscale(0.85)' } : undefined}
      >
        {/* Back hair (long/bob strands behind the body). */}
        {sideStrandHeight !== null && (
          <>
            <rect
              x={HEAD_CX - headR - 7}
              y={HEAD_CY - headR * 0.35}
              width={8}
              height={sideStrandHeight}
              rx={4}
              fill={visuals.hair}
            />
            <rect
              x={HEAD_CX + headR - 1}
              y={HEAD_CY - headR * 0.35}
              width={8}
              height={sideStrandHeight}
              rx={4}
              fill={visuals.hair}
            />
          </>
        )}

        {/* Torso + accent collar */}
        <rect x={44} y={84} width={52} height={70} rx={18} fill={visuals.outfit} />
        <rect x={47} y={87} width={46} height={12} rx={6} fill={visuals.outfitAccent} />

        {/* Neck */}
        <rect x={HEAD_CX - 6} y={HEAD_CY + headR * 0.62} width={12} height={18} rx={4} fill={visuals.skin} />

        {/* Ears */}
        <circle cx={HEAD_CX - headR * 0.94} cy={eyeY} r={headR * 0.13} fill={visuals.skin} />
        <circle cx={HEAD_CX + headR * 0.94} cy={eyeY} r={headR * 0.13} fill={visuals.skin} />

        {/* Head */}
        <circle cx={HEAD_CX} cy={HEAD_CY} r={headR} fill={visuals.skin} />

        {/* Hair */}
        {visuals.hairStyle === 'bald-ish' ? (
          <>
            <ellipse cx={HEAD_CX} cy={HEAD_CY - headR * 0.82} rx={headR * 0.3} ry={headR * 0.16} fill={visuals.hair} />
            <ellipse cx={HEAD_CX + headR * 0.5} cy={HEAD_CY - headR * 0.78} rx={headR * 0.16} ry={headR * 0.28} fill={visuals.hair} />
          </>
        ) : (
          <>
            <path d={capPath} fill={visuals.hair} />
            {sideStrandHeight !== null && (
              <>
                <rect
                  x={HEAD_CX - headR - 6}
                  y={HEAD_CY - headR * 0.3}
                  width={7}
                  height={sideStrandHeight}
                  rx={3.5}
                  fill={visuals.hair}
                />
                <rect
                  x={HEAD_CX + headR - 1}
                  y={HEAD_CY - headR * 0.3}
                  width={7}
                  height={sideStrandHeight}
                  rx={3.5}
                  fill={visuals.hair}
                />
              </>
            )}
          </>
        )}

        {/* Eyes */}
        <circle cx={HEAD_CX - eyeOffset} cy={eyeY} r={eyeR} fill="#3a2f2b" />
        <circle cx={HEAD_CX + eyeOffset} cy={eyeY} r={eyeR} fill="#3a2f2b" />
        <circle cx={HEAD_CX - eyeOffset - eyeR * 0.32} cy={eyeY - eyeR * 0.42} r={eyeR * 0.34} fill="#fff" />
        <circle cx={HEAD_CX + eyeOffset - eyeR * 0.32} cy={eyeY - eyeR * 0.42} r={eyeR * 0.34} fill="#fff" />

        {/* Mouth — gentle smile (emotion comes from the overlay). */}
        <path
          d={`M ${HEAD_CX - headR * 0.26} ${HEAD_CY + headR * 0.5} Q ${HEAD_CX} ${HEAD_CY + headR * 0.74} ${HEAD_CX + headR * 0.26} ${HEAD_CY + headR * 0.5}`}
          fill="none"
          stroke="#8a4a3a"
          strokeWidth={2.6}
          strokeLinecap="round"
        />

        {/* Glasses from middle age on. */}
        {visuals.glasses && (
          <g stroke="#7c6f61" strokeWidth={2} fill="none">
            <circle cx={HEAD_CX - eyeOffset} cy={eyeY} r={eyeR * 1.9} />
            <circle cx={HEAD_CX + eyeOffset} cy={eyeY} r={eyeR * 1.9} />
            <path d={`M ${HEAD_CX - eyeOffset + eyeR * 1.9} ${eyeY} L ${HEAD_CX + eyeOffset - eyeR * 1.9} ${eyeY}`} />
            <path d={`M ${HEAD_CX - eyeOffset - eyeR * 1.9} ${eyeY} L ${HEAD_CX - headR * 1.0} ${eyeY + 2}`} />
            <path d={`M ${HEAD_CX + eyeOffset + eyeR * 1.9} ${eyeY} L ${HEAD_CX + headR * 1.0} ${eyeY + 2}`} />
          </g>
        )}

        {/* Senior crow's feet. */}
        {stage === 'senior' && (
          <g stroke="#b98a66" strokeWidth={1.4} fill="none" opacity={0.7}>
            <path d={`M ${HEAD_CX - headR * 0.72} ${HEAD_CY + headR * 0.5} q 4 3 8 1`} />
            <path d={`M ${HEAD_CX + headR * 0.72} ${HEAD_CY + headR * 0.5} q -4 3 -8 1`} />
          </g>
        )}
      </svg>

      <ExpressionOverlay expression={expression} key={lastOutcomeTone ?? 'none'} />
    </div>
  );
}