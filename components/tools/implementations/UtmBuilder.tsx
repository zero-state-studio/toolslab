'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link,
  Copy,
  Check,
  Download,
  Trash2,
  Plus,
  Save,
  Upload,
  QrCode,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCopy } from '@/lib/hooks/useCopy';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { BaseToolProps } from '@/lib/types/tools';
import { useToolStore } from '@/lib/store/toolStore';
import {
  buildUtmUrl,
  parseUtmUrl,
  utmPresets,
  exportToCsv,
  saveTemplate,
  getTemplates,
  deleteTemplate,
  type UtmParameters,
  type UtmTemplate,
  type UtmBuilderResult,
} from '@/lib/tools/utm-builder';

interface UtmBuilderProps extends BaseToolProps {
  dictionary?: any;
}

export default function UtmBuilder({
  categoryColor,
  dictionary,
}: UtmBuilderProps) {
  const ui = dictionary?.tools?.['utm-builder']?.ui ?? {};
  const { copy } = useCopy();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // Main state
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [customParams, setCustomParams] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [result, setResult] = useState<UtmBuilderResult | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<UtmTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');

  // Load templates on mount
  useEffect(() => {
    setSavedTemplates(getTemplates());
  }, []);

  // Generate UTM URL
  const handleGenerate = useCallback(() => {
    const startTime = Date.now();

    const params: UtmParameters = {
      url: url.trim(),
      source: source.trim() || undefined,
      medium: medium.trim() || undefined,
      campaign: campaign.trim() || undefined,
      term: term.trim() || undefined,
      content: content.trim() || undefined,
      customParams: customParams
        .filter((p) => p.key && p.value)
        .reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {}),
    };

    const generated = buildUtmUrl(params);
    setResult(generated);

    if (generated.success && generated.url) {
      // Track in history
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'utm-builder',
        input: url,
        output: generated.url,
        timestamp: startTime,
      });

      scrollToResult();
    }
  }, [
    url,
    source,
    medium,
    campaign,
    term,
    content,
    customParams,
    addToHistory,
    scrollToResult,
  ]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (result?.url) {
      copy(result.url);
    }
  }, [result, copy]);

  // Download as text file
  const handleDownload = useCallback(() => {
    if (!result?.url) return;

    const blob = new Blob([result.url], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utm-link.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  // Apply preset
  const applyPreset = useCallback(
    (category: keyof typeof utmPresets, preset: string) => {
      const categoryPresets = utmPresets[category] as Record<
        string,
        { source?: string; medium?: string }
      >;
      const presetData = categoryPresets[preset];
      if (presetData) {
        setSource(presetData.source || '');
        setMedium(presetData.medium || '');
        setShowPresets(false);
      }
    },
    []
  );

  // Save as template
  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) {
      return;
    }

    const template = saveTemplate({
      name: templateName,
      parameters: {
        url: url || '',
        source: source || undefined,
        medium: medium || undefined,
        campaign: campaign || undefined,
        term: term || undefined,
        content: content || undefined,
      },
    });

    setSavedTemplates(getTemplates());
    setTemplateName('');
  }, [templateName, url, source, medium, campaign, term, content]);

  // Load template
  const loadTemplate = useCallback((template: UtmTemplate) => {
    setUrl(template.parameters.url || '');
    setSource(template.parameters.source || '');
    setMedium(template.parameters.medium || '');
    setCampaign(template.parameters.campaign || '');
    setTerm(template.parameters.term || '');
    setContent(template.parameters.content || '');
    setShowTemplates(false);
  }, []);

  // Delete template
  const handleDeleteTemplate = useCallback((id: string) => {
    deleteTemplate(id);
    setSavedTemplates(getTemplates());
  }, []);

  // Add custom parameter
  const addCustomParam = useCallback(() => {
    setCustomParams([...customParams, { key: '', value: '' }]);
  }, [customParams]);

  // Remove custom parameter
  const removeCustomParam = useCallback(
    (index: number) => {
      setCustomParams(customParams.filter((_, i) => i !== index));
    },
    [customParams]
  );

  // Update custom parameter
  const updateCustomParam = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      const updated = [...customParams];
      updated[index][field] = value;
      setCustomParams(updated);
    },
    [customParams]
  );

  // Clear all
  const handleClear = useCallback(() => {
    setUrl('');
    setSource('');
    setMedium('');
    setCampaign('');
    setTerm('');
    setContent('');
    setCustomParams([]);
    setResult(null);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            {ui.websiteUrl || 'Website URL'}
          </CardTitle>
          <CardDescription>
            {ui.websiteUrlDescription ||
              'Enter the destination URL you want to track'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">
              {ui.destinationUrl || 'Destination URL'} *
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* UTM Parameters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{ui.utmParameters || 'UTM Parameters'}</CardTitle>
              <CardDescription>
                {ui.utmParametersDescription ||
                  'Define your campaign tracking parameters'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {ui.presets || 'Presets'}
              {showPresets ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Presets */}
          {showPresets && (
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium">
                {ui.quickPresets || 'Quick Presets'}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">
                    {ui.socialMedia || 'Social Media'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(utmPresets.socialMedia).map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('socialMedia', preset)}
                        className="text-xs"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{ui.email || 'Email'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(utmPresets.email).map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('email', preset)}
                        className="text-xs"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    {ui.advertising || 'Advertising'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(utmPresets.advertising).map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('advertising', preset)}
                        className="text-xs"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    {ui.contentCategory || 'Content'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(utmPresets.content).map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('content', preset)}
                        className="text-xs"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UTM Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">
                {ui.campaignSource || 'Campaign Source'}
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="facebook, google, newsletter"
              />
              <p className="text-xs text-muted-foreground">
                {ui.campaignSourceHint ||
                  'Where the traffic originates (required)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medium">
                {ui.campaignMedium || 'Campaign Medium'}
              </Label>
              <Input
                id="medium"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="cpc, email, social"
              />
              <p className="text-xs text-muted-foreground">
                {ui.campaignMediumHint || 'Marketing medium (required)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign">
                {ui.campaignName || 'Campaign Name'}
              </Label>
              <Input
                id="campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="summer_sale, product_launch"
              />
              <p className="text-xs text-muted-foreground">
                {ui.campaignNameHint || 'Product, promo, or campaign name'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">
                {ui.campaignTerm || 'Campaign Term'}
              </Label>
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="running shoes"
              />
              <p className="text-xs text-muted-foreground">
                {ui.campaignTermHint || 'Paid search keywords'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="content">
                {ui.campaignContent || 'Campaign Content'}
              </Label>
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="logolink, textlink, button"
              />
              <p className="text-xs text-muted-foreground">
                {ui.campaignContentHint ||
                  'Differentiate similar content or links'}
              </p>
            </div>
          </div>

          {/* Custom Parameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{ui.customParameters || 'Custom Parameters'}</Label>
              <Button variant="outline" size="sm" onClick={addCustomParam}>
                <Plus className="mr-1 h-4 w-4" />
                {ui.add || 'Add'}
              </Button>
            </div>
            {customParams.map((param, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={param.key}
                  onChange={(e) =>
                    updateCustomParam(index, 'key', e.target.value)
                  }
                  placeholder={ui.parameterNamePlaceholder || 'Parameter name'}
                  className="flex-1"
                />
                <Input
                  value={param.value}
                  onChange={(e) =>
                    updateCustomParam(index, 'value', e.target.value)
                  }
                  placeholder={ui.valuePlaceholder || 'Value'}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomParam(index)}
                  className="px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={!url}>
              {ui.generateUtmUrl || 'Generate UTM URL'}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              {ui.clear || 'Clear'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <BookmarkPlus className="mr-2 h-4 w-4" />
              {ui.templates || 'Templates'}
            </Button>
          </div>

          {/* Templates */}
          {showTemplates && (
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium">
                {ui.savedTemplates || 'Saved Templates'}
              </h4>

              {/* Save new template */}
              <div className="flex gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={ui.templateNamePlaceholder || 'Template name'}
                  className="flex-1"
                />
                <Button onClick={handleSaveTemplate} size="sm">
                  <Save className="mr-1 h-4 w-4" />
                  {ui.save || 'Save'}
                </Button>
              </div>

              {/* Template list */}
              {savedTemplates.length > 0 ? (
                <div className="space-y-2">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between rounded border bg-background p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.parameters.source} /{' '}
                          {template.parameters.medium}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTemplate(template)}
                        >
                          {ui.load || 'Load'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {ui.noSavedTemplates || 'No saved templates yet'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && result.success && (
        <div ref={resultRef}>
          <Card>
            <CardHeader>
              <CardTitle>{ui.generatedUtmUrl || 'Generated UTM URL'}</CardTitle>
              <CardDescription>
                {ui.generatedUtmUrlDescription ||
                  'Your trackable URL is ready to use'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Display */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 break-all rounded-lg bg-muted p-3 font-mono text-sm">
                    {result.url}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {ui.copyUrl || 'Copy URL'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    {ui.download || 'Download'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {ui.testLink || 'Test Link'}
                  </Button>
                </div>
              </div>

              {/* Parameters Summary */}
              {result.parameters &&
                Object.keys(result.parameters).length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      {ui.parameters || 'Parameters'} (
                      {result.metadata?.parameterCount})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.parameters).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Metadata */}
              {result.metadata && (
                <Alert>
                  <AlertDescription className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ui.originalUrl || 'Original URL:'}
                      </span>
                      <span className="font-mono text-xs">
                        {result.metadata.originalUrl}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ui.parametersAdded || 'Parameters Added:'}
                      </span>
                      <span>{result.metadata.parameterCount}</span>
                    </div>
                    {result.metadata.hasCustomParams && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {ui.customParameters || 'Custom Parameters'}:
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {ui.yes || 'Yes'}
                        </Badge>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {result && !result.success && (
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
