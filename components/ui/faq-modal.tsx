'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { HelpCircle } from 'lucide-react';
import type { FAQData } from './faq-dialog';

// The radix-ui dialog (and the FAQ content) is only needed once the user
// clicks the floating help button — keep it out of the tool page first load.
const FAQDialog = dynamic(() => import('./faq-dialog'), { ssr: false });

interface FAQModalProps {
  categoryColor: string;
  toolName: string;
  locale?: string;
  faqData?: FAQData;
}

// Default English FAQs
const defaultFAQData: FAQData = {
  title: 'Frequently Asked Questions',
  close: 'Close',
  questions: [
    {
      question: 'Is this tool free to use?',
      answer:
        'Yes, all ToolsLab tools are completely free to use with no limits or registration required.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'All processing happens locally in your browser. Your data never leaves your device.',
    },
    {
      question: 'Can I use this offline?',
      answer:
        'Once loaded, most tools work offline as they process data locally in your browser.',
    },
    {
      question: 'How do I report a bug or request a feature?',
      answer:
        'You can report issues or request features on our GitHub repository at https://github.com/hellotoolslab/toolslab or reach out to us on X at https://x.com/tools_lab.',
    },
  ],
};

export function FAQModal({
  categoryColor,
  toolName,
  locale,
  faqData = defaultFAQData,
}: FAQModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      {/* FAQ Trigger Button */}
      <button
        onClick={() => {
          setHasOpened(true);
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 rounded-full p-3 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        style={{ backgroundColor: categoryColor }}
        aria-label="Open FAQ"
      >
        <HelpCircle className="h-6 w-6 text-white" />
      </button>

      {/* FAQ Modal - mounted on first open, stays mounted for close animation */}
      {hasOpened && (
        <FAQDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          categoryColor={categoryColor}
          faqData={faqData}
        />
      )}
    </>
  );
}
