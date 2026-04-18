'use client';

import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import {
  processRot13CaesarCipher,
  type CipherMode,
} from '@/lib/tools/rot13-caesar-cipher';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { useCopy } from '@/lib/hooks/useCopy';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Rot13CaesarCipherProps {
  categoryColor: string;
}

export default function Rot13CaesarCipher({
  categoryColor,
}: Rot13CaesarCipherProps) {
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });
  const { copied, copy } = useCopy();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CipherMode>('rot13');
  const [shift, setShift] = useState(3);
  const [output, setOutput] = useState('');
  const [rotations, setRotations] = useState<
    { shift: number; text: string }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const hasResult = output.length > 0 || (rotations && rotations.length > 0);

  useEffect(() => {
    if (hasResult) scrollToResult();
  }, [output, rotations, hasResult, scrollToResult]);

  const handleProcess = () => {
    if (!input) {
      setError('Please enter some text to process');
      setOutput('');
      setRotations(null);
      return;
    }

    const startTime = Date.now();
    const result = processRot13CaesarCipher(input, { mode, shift });

    if (result.success) {
      setError(null);
      if (mode === 'brute-force') {
        setOutput('');
        setRotations(result.rotations ?? []);
      } else {
        setOutput(result.result ?? '');
        setRotations(null);
      }

      if (isHydrated) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'rot13-caesar-cipher',
          input,
          output:
            mode === 'brute-force'
              ? `[brute-force: ${result.rotations?.length ?? 0} rotations]`
              : result.result ?? '',
          timestamp: startTime,
        });
      }
    } else {
      setError(result.error ?? 'Failed to process input');
      setOutput('');
      setRotations(null);
    }
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput('');
    setRotations(null);
  };

  const showShiftInput = mode === 'encode' || mode === 'decode';

  const inputStats = useMemo(
    () => ({
      characters: input.length,
      letters: (input.match(/[a-zA-Z]/g) ?? []).length,
    }),
    [input]
  );

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="mode-select">Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as CipherMode)}
          >
            <SelectTrigger id="mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rot13">ROT13 (one-click encode/decode)</SelectItem>
              <SelectItem value="encode">Caesar — encode with shift</SelectItem>
              <SelectItem value="decode">Caesar — decode with shift</SelectItem>
              <SelectItem value="brute-force">
                Brute force — show all 25 rotations
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showShiftInput && (
          <div className="space-y-2">
            <Label htmlFor="shift-input">Shift (1–25)</Label>
            <input
              id="shift-input"
              type="number"
              min={1}
              max={25}
              value={shift}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) setShift(Math.min(25, Math.max(1, v)));
              }}
              className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-28"
            />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cipher-input">Input Text</Label>
          <span className="text-xs text-muted-foreground">
            {inputStats.characters} chars · {inputStats.letters} letters
          </span>
        </div>
        <Textarea
          id="cipher-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to encode or decode..."
          className="min-h-[140px] font-mono text-sm"
        />
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleProcess}>
          {mode === 'brute-force' ? 'Show all 25 rotations' : 'Process'}
        </Button>
        {output && mode !== 'brute-force' && (
          <Button variant="outline" onClick={handleSwap}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Use output as input
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result area */}
      <div ref={resultRef}>
        {output && mode !== 'brute-force' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cipher-output">Output</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy(output)}
                className="h-8"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="cipher-output"
              readOnly
              value={output}
              className="min-h-[140px] font-mono text-sm"
            />
          </div>
        )}

        {rotations && rotations.length > 0 && (
          <div className="space-y-2">
            <Label>All 25 rotations</Label>
            <div className="max-h-[480px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="w-20 px-3 py-2 text-left font-medium">
                      Shift
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Output</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">
                      Copy
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rotations.map((rot) => (
                    <tr
                      key={rot.shift}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-3 py-2 font-semibold text-muted-foreground">
                        {rot.shift === 13 ? `${rot.shift} (ROT13)` : rot.shift}
                      </td>
                      <td className="px-3 py-2 break-all">{rot.text}</td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(rot.text)}
                          className="h-7"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
