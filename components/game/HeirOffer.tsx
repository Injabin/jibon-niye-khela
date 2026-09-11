'use client';

import type { FamilyMember } from '@/lib/engine/family';
import { Button } from '@/components/ui/Button';

/**
 * Legacy mode offer (DESIGN.md §5.8, init.md M5 #4): shown on the death
 * screen when surviving children have come of age. Each eligible heir gets a
 * button that hands the story over to them.
 */
export function HeirOffer({
  heirs,
  onContinue,
}: {
  heirs: FamilyMember[];
  onContinue: (heirId: string) => void;
}) {
  if (heirs.length === 0) return null;

  return (
    <section
      className="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
      data-testid="heir-offer"
    >
      <h2 className="text-base font-semibold tracking-tight text-text">গল্পটা এখানেই শেষ না — চলো এগাই!</h2>
      <p className="mt-1 text-sm text-text-muted">
        এক সন্তান বড় হইয়া গেছে — ও {heirs[0].name.split(' ').slice(-1)[0]} বংশের নামটা সামনে টাইনা নিতে পারে।
        বাপের-চ্যায়া সম্পদ {heirs.length === 1 ? 'ও একার হাতে' : `${heirs.length} জনের মাঝে ভাগ হবে`}।
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {heirs.map((heir) => (
          <Button
            key={heir.id}
            onClick={() => onContinue(heir.id)}
            data-testid={`continue-as-heir-${heir.id}`}
          >
            {heir.name} ({heir.age}) চরিত্রে খেলো
          </Button>
        ))}
      </div>
    </section>
  );
}