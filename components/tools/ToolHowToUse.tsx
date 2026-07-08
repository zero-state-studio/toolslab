'use client';

import {
  BookOpen,
  Lightbulb,
  AlertCircle,
  Keyboard,
  Target,
} from 'lucide-react';

export interface ToolInstruction {
  title: string;
  steps: Array<{ title: string; description: string }>;
  features?: string[];
  useCases?: string[];
  proTips?: string[];
  troubleshooting?: string[];
  keyboardShortcuts?: Array<{ keys: string; description: string }>;
}

interface ToolHowToUseProps {
  toolId: string;
  categoryColor: string;
  locale?: string;
  instructions?: ToolInstruction;
  labels?: {
    keyFeatures?: string;
    commonUseCases?: string;
    proTips?: string;
    troubleshooting?: string;
    keyboardShortcuts?: string;
    howToUse?: string;
  };
}

export default function ToolHowToUse({
  toolId,
  categoryColor,
  locale,
  instructions: translatedInstructions,
  labels,
}: ToolHowToUseProps) {
  // Use translated instructions if available AND it's a valid object
  const instruction =
    translatedInstructions &&
    typeof translatedInstructions === 'object' &&
    'steps' in translatedInstructions
      ? translatedInstructions
      : undefined;

  // Use translated labels if available, otherwise fallback to English
  const sectionLabels = {
    keyFeatures: labels?.keyFeatures || 'Key Features',
    commonUseCases: labels?.commonUseCases || 'Common Use Cases',
    proTips: labels?.proTips || 'Pro Tips',
    troubleshooting: labels?.troubleshooting || 'Troubleshooting',
    keyboardShortcuts: labels?.keyboardShortcuts || 'Keyboard Shortcuts',
    howToUse: labels?.howToUse || 'How to Use This Tool',
  };

  if (!instruction) {
    // Fallback to generic instructions if tool-specific content not found
    return (
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-card sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" style={{ color: categoryColor }} />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {sectionLabels.howToUse}
          </h2>
        </div>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              1
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Enter or paste your input in the text area above
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              2
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Configure any options or settings as needed
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              3
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Click the process button to generate your result
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              4
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Copy, download, or share your output as needed
            </span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4" style={{ minHeight: '400px' }}>
      {/* Main Instructions Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-card sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" style={{ color: categoryColor }} />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {instruction.title}
          </h2>
        </div>

        {/* Step-by-step Instructions */}
        {instruction.steps && instruction.steps.length > 0 && (
          <ol className="mb-5 space-y-3">
            {instruction.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Features Section */}
        {instruction.features && instruction.features.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Target className="h-4 w-4" style={{ color: categoryColor }} />
              {sectionLabels.keyFeatures}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {instruction.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Use Cases and Pro Tips Grid */}
      {((instruction.useCases && instruction.useCases.length > 0) ||
        (instruction.proTips && instruction.proTips.length > 0)) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Use Cases */}
          {instruction.useCases && instruction.useCases.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-card sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Target className="h-4 w-4" style={{ color: categoryColor }} />
                {sectionLabels.commonUseCases}
              </h3>
              <ul className="space-y-2">
                {instruction.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span
                      className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {useCase}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro Tips */}
          {instruction.proTips && instruction.proTips.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-500/20 dark:bg-none dark:bg-amber-500/5 dark:from-transparent dark:to-transparent sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {sectionLabels.proTips}
              </h3>
              <ul className="space-y-2">
                {instruction.proTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                    <span className="text-sm text-amber-800 dark:text-amber-200">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Troubleshooting and Keyboard Shortcuts Grid */}
      {((instruction.troubleshooting &&
        instruction.troubleshooting.length > 0) ||
        (instruction.keyboardShortcuts &&
          instruction.keyboardShortcuts.length > 0)) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Troubleshooting */}
          {instruction.troubleshooting &&
            instruction.troubleshooting.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 dark:border-red-500/20 dark:bg-none dark:bg-red-500/5 dark:from-transparent dark:to-transparent sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  {sectionLabels.troubleshooting}
                </h3>
                <ul className="space-y-2">
                  {instruction.troubleshooting.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600 dark:bg-red-400" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        {issue}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Keyboard Shortcuts */}
          {instruction.keyboardShortcuts &&
            instruction.keyboardShortcuts.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-500/20 dark:bg-none dark:bg-blue-500/5 dark:from-transparent dark:to-transparent sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Keyboard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {sectionLabels.keyboardShortcuts}
                </h3>
                <div className="space-y-3">
                  {instruction.keyboardShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        {shortcut.description}
                      </span>
                      <kbd className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800/40 dark:text-blue-200">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
