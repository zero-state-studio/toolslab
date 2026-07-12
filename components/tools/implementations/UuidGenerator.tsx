'use client';

import { useState } from 'react';
import { Copy, Check, Hash, Zap } from 'lucide-react';
import { useMultiCopy } from '@/lib/hooks/useCopy';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps, UUIDVersion } from '@/lib/types/tools';
import { ToolFrame } from '@/components/tools/ToolFrame';

interface UuidGeneratorProps extends BaseToolProps {}

export default function UuidGenerator({ categoryColor, dictionary }: UuidGeneratorProps) {
  const ui = dictionary?.tools?.['uuid-generator']?.ui ?? {};

  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<UUIDVersion>('v4');
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);

  const { copy, isCopied } = useMultiCopy<number | string>();
  const { addToHistory } = useToolStore();

  const generateUUID = () => {
    const startTime = Date.now();
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      let uuid = crypto.randomUUID();
      if (!hyphens) uuid = uuid.replace(/-/g, '');
      if (uppercase) uuid = uuid.toUpperCase();
      newUuids.push(uuid);
    }
    setUuids(newUuids);
    const generated = newUuids.join('\n');
    const configSummary = `version=${version}, count=${count}, uppercase=${uppercase}, hyphens=${hyphens}`;
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'uuid-generator',
      input: configSummary,
      output: generated,
      timestamp: startTime,
    });
  };

  const joinedUuids = uuids.join('\n');
  const hasResults = uuids.length > 0;

  return (
    <ToolFrame
      title={ui.frameTitle || 'UUID Generator'}
      subtitle={ui.frameSubtitle || 'Universally Unique Identifier'}
      icon={<Hash className="h-5 w-5" />}
      categoryColor={categoryColor}
      primaryAction={{
        label: count > 1 ? (ui.generateBtnPlural || 'Generate UUIDs') : (ui.generateBtn || 'Generate UUID'),
        icon: <Zap className="h-4 w-4" />,
        onClick: generateUUID,
      }}
    >
      <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="uuid-count"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {ui.countLabel || 'Count'}
            </label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) =>
                setCount(
                  Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="uuid-version"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {ui.versionLabel || 'Version'}
            </label>
            <select
              id="uuid-version"
              value={version}
              onChange={(e) => setVersion(e.target.value as UUIDVersion)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="v4">{ui.versionV4 || 'Version 4 (Random)'}</option>
              <option value="v1">{ui.versionV1 || 'Version 1 (Timestamp)'}</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded"
              style={{ accentColor: categoryColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {ui.uppercaseLabel || 'Uppercase'}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(e) => setHyphens(e.target.checked)}
              className="rounded"
              style={{ accentColor: categoryColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {ui.hyphensLabel || 'Include hyphens'}
            </span>
          </label>
        </div>
      </div>

      <ToolFrame.Output
        title={`${ui.outputTitle || 'Generated UUIDs'}${hasResults ? ` (${uuids.length})` : ''}`}
        copyText={joinedUuids}
        downloadText={joinedUuids}
        downloadFilename="uuids.txt"
        onRegenerate={hasResults ? generateUUID : undefined}
        show={hasResults}
        emptyState={
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ui.emptyStateText || 'Click'}{' '}
            <span className="font-medium">{ui.emptyStateHighlight || 'Generate'}</span>{' '}
            {ui.emptyStateSuffix || 'to create UUIDs.'}
          </p>
        }
      >
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              style={{
                borderColor: isCopied(index) ? categoryColor : undefined,
              }}
            >
              <span className="w-8 text-xs text-gray-500 dark:text-gray-400">
                {index + 1}.
              </span>
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white">
                {uuid}
              </code>
              <button
                onClick={() => copy(uuid, index)}
                aria-label={`${ui.copyAriaLabel || 'Copy UUID'} ${index + 1}`}
                className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-700"
              >
                {isCopied(index) ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </ToolFrame.Output>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {ui.infoText || 'UUIDs are 128-bit unique identifiers that are practically guaranteed to be unique across all systems and time.'}
        </p>
      </div>
    </ToolFrame>
  );
}
