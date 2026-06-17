'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Copy,
  Check,
  FileDown,
  FileUp,
  Trash2,
  FileText,
  Settings,
  Info,
} from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { xmlToJson, XmlToJsonOptions } from '@/lib/tools/xml-to-json';
import { Badge } from '@/components/ui/badge';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns:bk="http://books.example.com">
  <book id="1" category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">10.99</price>
    <description><![CDATA[A classic novel about the American Dream]]></description>
  </book>
  <book id="2" category="science">
    <title lang="en">A Brief History of Time</title>
    <author>Stephen Hawking</author>
    <year>1988</year>
    <price currency="USD">18.99</price>
    <in-stock>true</in-stock>
  </book>
</bookstore>`;

export default function XmlToJsonConverter({ dictionary }: { dictionary?: any }) {
  const ui = dictionary?.tools?.['xml-to-json-converter']?.ui ?? {};
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  // Options
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [attributeMode, setAttributeMode] = useState<
    'verbose' | 'compact' | 'inline'
  >('inline');
  const [removeNamespaces, setRemoveNamespaces] = useState(false);
  const [arrayMode, setArrayMode] = useState(true);
  const [convertTypes, setConvertTypes] = useState(false);

  const [showOptions, setShowOptions] = useState(false);

  // Ref per scroll automatico al risultato
  const outputRef = useRef<HTMLDivElement>(null);

  // Effect per scroll quando c'è un nuovo output
  useEffect(() => {
    if (output && outputRef.current) {
      // Piccolo delay per assicurarsi che il rendering sia completo
      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [output]);

  const handleConvert = () => {
    if (!input.trim()) {
      setError('Please enter XML to convert');
      setOutput('');
      setMetadata(null);
      return;
    }

    const startTime = Date.now();

    const options: XmlToJsonOptions = {
      prettyPrint,
      attributeMode,
      removeNamespaces,
      arrayMode,
      convertTypes,
    };

    const result = xmlToJson(input, options);

    if (result.success && result.result) {
      setOutput(result.result);
      setError(null);
      setMetadata(result.metadata);

      // Add to history
      if (isHydrated) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'xml-to-json-converter',
          input: input.substring(0, 100),
          output: result.result.substring(0, 100),
          timestamp: startTime,
        });
      }
    } else {
      setError(result.error || 'Conversion failed');
      setOutput('');
      setMetadata(null);
    }
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setMetadata(null);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_XML);
    setError(null);
  };

  const handleDownload = () => {
    if (!output) return;

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Options Panel */}
      <Card className="bg-muted/30 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-between"
          onClick={() => setShowOptions(!showOptions)}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{ui.conversionOptions || 'Conversion Options'}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {showOptions ? (ui.hide || 'Hide') : (ui.show || 'Show')}
          </Badge>
        </Button>
        {showOptions && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="prettyPrint">{ui.prettyPrintLabel || 'Pretty Print'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {ui.prettyPrintDesc || 'Format JSON with indentation'}
                  </p>
                </div>
                <Switch
                  id="prettyPrint"
                  checked={prettyPrint}
                  onCheckedChange={setPrettyPrint}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <div className="space-y-0.5">
                  <Label htmlFor="attributeMode">{ui.attributeModeLabel || 'Attribute Mode'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {ui.attributeModeDesc || 'How to handle XML attributes'}
                  </p>
                </div>
                <Select
                  value={attributeMode}
                  onValueChange={(value) =>
                    setAttributeMode(value as 'verbose' | 'compact' | 'inline')
                  }
                >
                  <SelectTrigger id="attributeMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inline">
                      {ui.attrInline || 'Inline (id, category)'}
                    </SelectItem>
                    <SelectItem value="compact">
                      {ui.attrCompact || 'Compact (@id, @category)'}
                    </SelectItem>
                    <SelectItem value="verbose">
                      {ui.attrVerbose || 'Verbose (@attributes)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="removeNamespaces">{ui.removeNamespacesLabel || 'Remove Namespaces'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {ui.removeNamespacesDesc || 'Strip namespace prefixes'}
                  </p>
                </div>
                <Switch
                  id="removeNamespaces"
                  checked={removeNamespaces}
                  onCheckedChange={setRemoveNamespaces}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="arrayMode">{ui.smartArraysLabel || 'Smart Arrays'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {ui.smartArraysDesc || 'Auto-detect repeated elements'}
                  </p>
                </div>
                <Switch
                  id="arrayMode"
                  checked={arrayMode}
                  onCheckedChange={setArrayMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="convertTypes">{ui.typeConversionLabel || 'Type Conversion'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {ui.typeConversionDesc || 'Convert numbers and booleans'}
                  </p>
                </div>
                <Switch
                  id="convertTypes"
                  checked={convertTypes}
                  onCheckedChange={setConvertTypes}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Input Section */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="xml-input" className="text-base font-semibold">
              {ui.xmlInputLabel || 'XML Input'}
            </Label>
            <div className="flex gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                className="h-8"
              >
                <FileText className="h-3.5 w-3.5 md:mr-1.5" />
                <span className="hidden md:inline">{ui.sampleBtn || 'Sample'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="h-8"
              >
                <FileUp className="h-3.5 w-3.5 md:mr-1.5" />
                <span className="hidden md:inline">{ui.uploadBtn || 'Upload'}</span>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".xml,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          <Textarea
            id="xml-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.inputPlaceholder || 'Paste your XML here...'}
            className="min-h-[300px] resize-y font-mono text-sm"
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleConvert} className="flex-1" size="lg">
          {ui.convertBtn || 'Convert to JSON'}
        </Button>
        <Button onClick={handleClear} variant="outline" size="lg">
          <Trash2 className="mr-2 h-4 w-4" />
          {ui.clearBtn || 'Clear'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium text-destructive">{ui.conversionError || 'Conversion Error'}</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Metadata Display */}
      {metadata && (
        <Card className="bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">{ui.xmlSizeLabel || 'XML Size'}</p>
              <p className="font-semibold">{metadata.xmlSize} bytes</p>
            </div>
            <div>
              <p className="text-muted-foreground">{ui.jsonSizeLabel || 'JSON Size'}</p>
              <p className="font-semibold">{metadata.jsonSize} bytes</p>
            </div>
            <div>
              <p className="text-muted-foreground">{ui.elementsLabel || 'Elements'}</p>
              <p className="font-semibold">{metadata.elementCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{ui.processingTimeLabel || 'Processing Time'}</p>
              <p className="font-semibold">{metadata.processingTime}ms</p>
            </div>
          </div>
        </Card>
      )}

      {/* Output Section */}
      {output && (
        <div ref={outputRef}>
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="json-output"
                  className="text-base font-semibold"
                >
                  {ui.jsonOutputLabel || 'JSON Output'}
                </Label>
                <div className="flex gap-1 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 md:mr-1.5" />
                        <span className="hidden md:inline">{ui.copiedBtn || 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 md:mr-1.5" />
                        <span className="hidden md:inline">{ui.copyBtn || 'Copy'}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8"
                  >
                    <FileDown className="h-3.5 w-3.5 md:mr-1.5" />
                    <span className="hidden md:inline">{ui.downloadBtn || 'Download'}</span>
                  </Button>
                </div>
              </div>
              <Textarea
                id="json-output"
                value={output}
                readOnly
                className="min-h-[300px] resize-y bg-muted/50 font-mono text-sm"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
