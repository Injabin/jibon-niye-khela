'use client';

import { motion } from 'framer-motion';
import type { Character } from '@/lib/engine/types';
import { motion as motionTokens } from '@/lib/theme';
import { StatBar } from './StatBar';

export function LifeSummary({ character }: { character: Character }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-surface p-5 shadow-md"
      data-testid="life-summary"
    >
      <h2 className="text-xl font-semibold tracking-tight text-text">Life over</h2>
      <p className="mt-1 text-sm text-text-muted">
        {character.name} {character.surname} lived for {character.age} years.
      </p>
      <p className="mt-3 text-text">
        Cause of death: <span className="font-medium">{character.causeOfDeath}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </div>

      <p className="mt-5 text-sm text-text-muted">
        A full life summary with your story timeline arrives in a later milestone.
      </p>
    </motion.section>
  );
}