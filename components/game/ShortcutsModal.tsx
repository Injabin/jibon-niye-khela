'use client';

import { Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalOverlay } from '@/components/ui/ModalOverlay';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  context?: string;
}

const SHORTCUTS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'মূল খেলা',
    items: [
      {
        keys: ['Space', 'Enter'],
        description: 'বয়স +১ বছর আগাইয়া দাও বা সিলেক্ট করা কাজই নিশ্চিত করো',
        context: 'ড্যাশবোর্ড / নিয়ন্ত্রণ',
      },
      {
        keys: ['1', '2', '3', '4'],
        description: 'চলমান ঘটনা-কার্ডে নম্বর দিয়া বাছাই করো',
        context: 'ঘটনার ফয়ে-সালা',
      },
    ],
  },
  {
    category: 'ঘুরাঘুরি আর ওভারলে',
    items: [
      {
        keys: ['Esc'],
        description: 'খোলা পর্দা বন্ধ করো / পজ মেনু খোলো (খেলার ভেতরে)',
        context: 'যেকোনো জায়গায়',
      },
      {
        keys: ['?'],
        description: 'এই কিবোর্ড শর্টকাট গাইড খোলো-বন্ধ করো',
        context: 'যেকোনো জায়গায়',
      },
      {
        keys: ['Tab', 'Shift + Tab'],
        description: 'ইন্টারঅ্যাক্টিভ জিনিসগুলোতে ফোকাস ঘুরাও',
        context: 'যেকোনো জায়গায়',
      },
      {
        keys: ['Arrow Keys'],
        description: 'অপশন, ট্যাব আর তালিকায় চলো',
        context: 'মেনু আর স্টেপার',
      },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <ModalOverlay
      open={open}
      onClose={onClose}
      id="shortcuts"
      title="কিবোর্ড শর্টকাট"
      subtitle="মাউস ছাড়াই সারাটা খেলার লাগাম নিজের হাতে!"
      icon={<Keyboard className="size-5" />}
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} autoFocus>
            বন্ধ করো (Esc)
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {SHORTCUTS.map((section) => (
          <div key={section.category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-surface-raised/60 p-3 hover:bg-surface-raised transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-md border border-border bg-surface-raised text-xs font-mono font-semibold text-text shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                    <span className="ml-1 text-xs font-medium text-text">{item.description}</span>
                  </div>
                  {item.context && (
                    <span className="shrink-0 self-end text-[10px] font-mono uppercase tracking-wider text-text-muted sm:self-auto">
                      {item.context}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-tone-good/30 bg-tone-good/10 p-3 text-xs text-tone-text-good">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong>বুদ্ধিমান সুরক্ষা:</strong> টেক্সট বক্সে লেখালেখির সময় (যেমন নাম লেখা) খেলার
          শর্টকাটগুলো আপনা-আপনি বন্ধ থাইকা যায়, যাতে ভুলবশত কিছু না ঘটা ঘটে!
        </span>
      </div>
    </ModalOverlay>
  );
}