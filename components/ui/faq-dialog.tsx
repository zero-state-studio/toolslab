'use client';

import { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData {
  title: string;
  close: string;
  questions: FAQItem[];
}

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryColor: string;
  faqData: FAQData;
}

export default function FAQDialog({
  open,
  onOpenChange,
  categoryColor,
  faqData,
}: FAQDialogProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const faqs = faqData.questions || [];

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[80vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <HelpCircle className="h-5 w-5" style={{ color: categoryColor }} />
            {faqData.title}
          </Dialog.Title>

          <div className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto pr-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      openItems.has(index) ? 'rotate-90' : ''
                    }`}
                    style={{ color: categoryColor }}
                  />
                </button>
                {openItems.has(index) && (
                  <div className="mt-3 pl-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">{faqData.close}</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
