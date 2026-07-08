'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyIcon, CheckIcon, TerminalIcon } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import {
  Permissions,
  Permission,
  ChmodResult,
  PERMISSION_PRESETS,
  permissionsToResult,
  parseOctal,
  isValidOctal,
  getDefaultPermissions,
} from '@/lib/tools/chmod-calculator';

interface ChmodCalculatorProps extends BaseToolProps {}

// Permission checkbox component
function PermissionCheckbox({
  label,
  checked,
  onChange,
  colorClass,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${
        checked
          ? `${colorClass} border-current text-white`
          : 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

// Permission row component (Owner, Group, or Others)
function PermissionRow({
  title,
  permission,
  onChange,
  colorClass,
  labels,
}: {
  title: string;
  permission: Permission;
  onChange: (permission: Permission) => void;
  colorClass: string;
  labels: { read: string; write: string; execute: string };
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </div>
      <div className="flex gap-2">
        <PermissionCheckbox
          label={labels.read}
          checked={permission.read}
          onChange={(checked) => onChange({ ...permission, read: checked })}
          colorClass={colorClass}
        />
        <PermissionCheckbox
          label={labels.write}
          checked={permission.write}
          onChange={(checked) => onChange({ ...permission, write: checked })}
          colorClass={colorClass}
        />
        <PermissionCheckbox
          label={labels.execute}
          checked={permission.execute}
          onChange={(checked) => onChange({ ...permission, execute: checked })}
          colorClass={colorClass}
        />
      </div>
    </div>
  );
}

export default function ChmodCalculator({ dictionary }: ChmodCalculatorProps) {
  const { addToHistory } = useToolStore();
  const [permissions, setPermissions] = useState<Permissions>(
    getDefaultPermissions()
  );
  const [filename, setFilename] = useState('file.txt');
  const [octalInput, setOctalInput] = useState('644');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRecursive, setIsRecursive] = useState(false);

  // Get translations with fallbacks
  const t = dictionary?.tools?.['chmod-calculator'] || {};
  const labels = {
    owner: t.owner || 'Owner',
    group: t.group || 'Group',
    others: t.others || 'Others',
    read: t.read || 'R',
    write: t.write || 'W',
    execute: t.execute || 'X',
    octalNotation: t.octalNotation || 'Octal Notation',
    symbolicNotation: t.symbolicNotation || 'Symbolic Notation',
    command: t.command || 'Command',
    filename: t.filename || 'Filename',
    presets: t.presets || 'Common Presets',
    recursive: t.recursive || 'Recursive (-R)',
    binaryRepresentation: t.binaryRepresentation || 'Binary',
    permissionGrid: t.permissionGrid || 'Permission Grid',
    results: t.results || 'Results',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
  };

  // Calculate result whenever permissions change
  const result: ChmodResult = permissionsToResult(permissions, filename);

  // Update octal input when permissions change
  useEffect(() => {
    setOctalInput(result.octal);
  }, [result.octal]);

  // Handle octal input change
  const handleOctalChange = useCallback((value: string) => {
    setOctalInput(value);
    if (isValidOctal(value) && value.length >= 1) {
      const parsed = parseOctal(value);
      if (parsed) {
        setPermissions(parsed);
      }
    }
  }, []);

  // Handle preset click
  const handlePresetClick = useCallback((octal: string) => {
    const parsed = parseOctal(octal);
    if (parsed) {
      setPermissions(parsed);
      setOctalInput(octal);
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);

        // Track usage
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'chmod-calculator',
          input: JSON.stringify(permissions),
          output: text,
          timestamp: Date.now(),
        });
      } catch {
        console.error('Failed to copy');
      }
    },
    [addToHistory, permissions]
  );

  // Get the command with recursive flag if needed
  const fullCommand = isRecursive
    ? `chmod -R ${result.octal} ${filename}`
    : result.command;

  return (
    <div className="space-y-4">
      {/* Permission Grid */}
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {labels.permissionGrid}
        </h3>

        {/* Header row */}
        <div className="mb-4 flex items-center gap-4">
          <div className="w-20" />
          <div className="flex gap-2">
            <div className="flex h-8 w-10 items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {labels.read}
            </div>
            <div className="flex h-8 w-10 items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {labels.write}
            </div>
            <div className="flex h-8 w-10 items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {labels.execute}
            </div>
          </div>
        </div>

        {/* Permission rows */}
        <div className="space-y-3">
          <PermissionRow
            title={labels.owner}
            permission={permissions.owner}
            onChange={(p) => setPermissions({ ...permissions, owner: p })}
            colorClass="bg-blue-500"
            labels={{ read: 'R', write: 'W', execute: 'X' }}
          />
          <PermissionRow
            title={labels.group}
            permission={permissions.group}
            onChange={(p) => setPermissions({ ...permissions, group: p })}
            colorClass="bg-green-500"
            labels={{ read: 'R', write: 'W', execute: 'X' }}
          />
          <PermissionRow
            title={labels.others}
            permission={permissions.others}
            onChange={(p) => setPermissions({ ...permissions, others: p })}
            colorClass="bg-orange-500"
            labels={{ read: 'R', write: 'W', execute: 'X' }}
          />
        </div>
      </Card>

      {/* Results */}
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {labels.results}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Octal */}
          <div>
            <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
              {labels.octalNotation}
            </Label>
            <div className="flex gap-2">
              <Input
                value={octalInput}
                onChange={(e) => handleOctalChange(e.target.value)}
                className="font-mono text-2xl font-bold"
                maxLength={4}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => copyToClipboard(result.octal, 'octal')}
              >
                {copiedField === 'octal' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Symbolic */}
          <div>
            <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
              {labels.symbolicNotation}
            </Label>
            <div className="flex gap-2">
              <Input
                value={result.symbolic}
                readOnly
                className="font-mono text-lg"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => copyToClipboard(result.symbolic, 'symbolic')}
              >
                {copiedField === 'symbolic' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Binary */}
          <div>
            <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
              {labels.binaryRepresentation}
            </Label>
            <div className="flex gap-2">
              <Input
                value={result.binary}
                readOnly
                className="font-mono text-lg tracking-wider"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => copyToClipboard(result.binary, 'binary')}
              >
                {copiedField === 'binary' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filename */}
          <div>
            <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
              {labels.filename}
            </Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="file.txt"
              className="font-mono"
            />
          </div>
        </div>

        {/* Command output */}
        <div className="mt-4">
          <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
            {labels.command}
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-mono text-green-400">
              <TerminalIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">$</span>
              <span>{fullCommand}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => copyToClipboard(fullCommand, 'command')}
            >
              {copiedField === 'command' ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Recursive option */}
          <label className="mt-3 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isRecursive}
              onChange={(e) => setIsRecursive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {labels.recursive}
            </span>
          </label>
        </div>
      </Card>

      {/* Presets */}
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {labels.presets}
        </h3>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERMISSION_PRESETS.map((preset) => (
            <button
              key={preset.octal}
              onClick={() => handlePresetClick(preset.octal)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                result.octal === preset.octal
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 font-mono font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {preset.octal}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {preset.name}
                </div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {preset.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
