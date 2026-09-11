'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X, Sparkles } from 'lucide-react';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';

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
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            data-testid="shortcuts-backdrop"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            role="dialog"
            aria-modal="true"
            aria-label="কিবোর্ড শর্টকাট"
            tabIndex={-1}
            onKeyDown={trapKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
            data-testid="shortcuts-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Keyboard className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">কিবোর্ড শর্টকাট</h2>
                  <p className="text-xs text-zinc-400">মাউস ছাড়াই সারাটা খেলার লাগাম নিজের হাতে!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="শর্টকাট-পর্দা বন্ধ করো"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-6">
              {SHORTCUTS.map((section) => (
                <div key={section.category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.keys.map((key) => (
                            <kbd
                              key={key}
                              className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-md border border-white/15 bg-white/10 text-xs font-mono font-semibold text-zinc-100 shadow-inner"
                            >
                              {key}
                            </kbd>
                          ))}
                          <span className="text-xs text-zinc-200 font-medium ml-1">
                            {item.description}
                          </span>
                        </div>
                        {item.context && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 self-end sm:self-auto">
                            {item.context}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Input safety notice */}
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2.5">
              <Sparkles className="size-4 shrink-0 mt-0.5" />
              <span>
                <strong>বুদ্ধিমান সুরক্ষা:</strong> টেক্সট বক্সে লেখালেখির সময় (যেমন নাম লেখা) খেলার শর্টকাটগুলো আপনা-আপনি বন্ধ থাইকা যায়, যাতে ভুলবশত কিছু না ঘটা ঘটে!
              </span>
            </div>

            {/* Close footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                বন্ধ করো (Esc)
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
