'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CopyIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  ShieldIcon,
  ZapIcon,
  LinkIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import {
  HtaccessConfig,
  RedirectRule,
  CustomErrorPage,
  IpRule,
  getDefaultConfig,
  generateHtaccess,
  createRedirectRule,
  createErrorPage,
  createIpRule,
  HTACCESS_PRESETS,
  ERROR_CODES,
  CACHE_PRESETS,
  secondsToReadable,
} from '@/lib/tools/htaccess-generator';

interface HtaccessGeneratorProps extends BaseToolProps {}

// Tab component
function TabButton({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// Toggle switch component
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </div>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}
      </div>
    </label>
  );
}

export default function HtaccessGenerator({
  dictionary,
}: HtaccessGeneratorProps) {
  const { addToHistory } = useToolStore();
  const [config, setConfig] = useState<HtaccessConfig>(getDefaultConfig());
  const [activeTab, setActiveTab] = useState<
    'security' | 'redirects' | 'caching' | 'advanced'
  >('security');
  const [output, setOutput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get translations with fallbacks
  const t = dictionary?.tools?.['htaccess-generator'] || {};
  const labels = {
    title: t.title || 'Htaccess Generator',
    generate: t.generate || 'Generate .htaccess',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    download: t.download || 'Download',
    presets: t.presets || 'Presets',
    security: t.security || 'Security',
    redirects: t.redirects || 'Redirects',
    caching: t.caching || 'Caching',
    advanced: t.advanced || 'Advanced',
    output: t.output || 'Generated .htaccess',
    // Security labels
    forceHttps: t.forceHttps || 'Force HTTPS',
    forceHttpsDesc: t.forceHttpsDesc || 'Redirect all HTTP traffic to HTTPS',
    removeWww: t.removeWww || 'Remove www',
    removeWwwDesc: t.removeWwwDesc || 'Redirect www to non-www version',
    addWww: t.addWww || 'Add www',
    addWwwDesc: t.addWwwDesc || 'Redirect non-www to www version',
    preventDirListing: t.preventDirListing || 'Prevent Directory Listing',
    preventDirListingDesc: t.preventDirListingDesc || 'Hide directory contents',
    blockSensitiveFiles: t.blockSensitiveFiles || 'Block Sensitive Files',
    blockSensitiveFilesDesc:
      t.blockSensitiveFilesDesc || 'Block access to .htaccess, .env, etc.',
    securityHeaders: t.securityHeaders || 'Security Headers',
    securityHeadersDesc:
      t.securityHeadersDesc || 'Add XSS, MIME, Frame protection headers',
    blockXmlRpc: t.blockXmlRpc || 'Block XML-RPC (WordPress)',
    blockXmlRpcDesc: t.blockXmlRpcDesc || 'Disable XML-RPC endpoint',
    blockWpIncludes: t.blockWpIncludes || 'Protect wp-includes (WordPress)',
    blockWpIncludesDesc:
      t.blockWpIncludesDesc || 'Block direct access to WordPress includes',
    // Caching labels
    enableCaching: t.enableCaching || 'Enable Browser Caching',
    enableCachingDesc:
      t.enableCachingDesc || 'Set expiry headers for static assets',
    enableGzip: t.enableGzip || 'Enable Gzip Compression',
    enableGzipDesc: t.enableGzipDesc || 'Compress text-based responses',
    enableBrotli: t.enableBrotli || 'Enable Brotli Compression',
    enableBrotliDesc:
      t.enableBrotliDesc || 'Modern compression (requires mod_brotli)',
    // Redirect labels
    addRedirect: t.addRedirect || 'Add Redirect',
    from: t.from || 'From',
    to: t.to || 'To',
    type: t.type || 'Type',
    // Error pages
    errorPages: t.errorPages || 'Custom Error Pages',
    addErrorPage: t.addErrorPage || 'Add Error Page',
    errorCode: t.errorCode || 'Error Code',
    errorPath: t.errorPath || 'Page Path',
    // IP rules
    ipRules: t.ipRules || 'IP Access Control',
    addIpRule: t.addIpRule || 'Add IP Rule',
    ipAddress: t.ipAddress || 'IP Address',
    allow: t.allow || 'Allow',
    deny: t.deny || 'Deny',
    // Custom rules
    customRules: t.customRules || 'Custom Rules',
    customRulesPlaceholder:
      t.customRulesPlaceholder || 'Add your custom .htaccess rules here...',
    // Redirects empty state
    noRedirects: t.noRedirects || 'No redirects configured. Click "Add Redirect" to create one.',
    // Cache section labels
    htmlCache: t.htmlCache || 'HTML Cache',
    cssJsCache: t.cssJsCache || 'CSS/JS Cache',
    imageCache: t.imageCache || 'Image Cache',
    fontCache: t.fontCache || 'Font Cache',
    // Cache duration options
    noCache: t.noCache || 'No cache',
    oneHour: t.oneHour || '1 hour',
    oneDay: t.oneDay || '1 day',
    oneWeek: t.oneWeek || '1 week',
    oneMonth: t.oneMonth || '1 month',
    oneYear: t.oneYear || '1 year',
  };

  // Generate output whenever config changes
  useEffect(() => {
    const generated = generateHtaccess(config);
    setOutput(generated);
  }, [config]);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = HTACCESS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        ...preset.config,
        security: { ...prev.security, ...preset.config.security },
        caching: { ...prev.caching, ...preset.config.caching },
      }));
    }
  }, []);

  // Update security config
  const updateSecurity = useCallback(
    (key: keyof HtaccessConfig['security'], value: boolean | string) => {
      setConfig((prev) => {
        // Handle mutually exclusive options
        if (key === 'removeWww' && value === true) {
          return {
            ...prev,
            security: { ...prev.security, removeWww: true, addWww: false },
          };
        }
        if (key === 'addWww' && value === true) {
          return {
            ...prev,
            security: { ...prev.security, addWww: true, removeWww: false },
          };
        }
        return {
          ...prev,
          security: { ...prev.security, [key]: value },
        };
      });
    },
    []
  );

  // Update caching config
  const updateCaching = useCallback(
    (key: keyof HtaccessConfig['caching'], value: boolean | number) => {
      setConfig((prev) => ({
        ...prev,
        caching: { ...prev.caching, [key]: value },
      }));
    },
    []
  );

  // Redirect management
  const addRedirect = useCallback(() => {
    const newRedirect = createRedirectRule('/old-page', '/new-page');
    setConfig((prev) => ({
      ...prev,
      redirects: [...prev.redirects, newRedirect],
    }));
  }, []);

  const updateRedirect = useCallback(
    (id: string, updates: Partial<RedirectRule>) => {
      setConfig((prev) => ({
        ...prev,
        redirects: prev.redirects.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));
    },
    []
  );

  const removeRedirect = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      redirects: prev.redirects.filter((r) => r.id !== id),
    }));
  }, []);

  // Error page management
  const addErrorPageHandler = useCallback(() => {
    const newPage = createErrorPage('404', '/404.html');
    setConfig((prev) => ({
      ...prev,
      errorPages: [...prev.errorPages, newPage],
    }));
  }, []);

  const updateErrorPage = useCallback(
    (index: number, updates: Partial<CustomErrorPage>) => {
      setConfig((prev) => ({
        ...prev,
        errorPages: prev.errorPages.map((p, i) =>
          i === index ? { ...p, ...updates } : p
        ),
      }));
    },
    []
  );

  const removeErrorPage = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      errorPages: prev.errorPages.filter((_, i) => i !== index),
    }));
  }, []);

  // IP rule management
  const addIpRuleHandler = useCallback(() => {
    const newRule = createIpRule('', 'deny');
    setConfig((prev) => ({
      ...prev,
      ipRules: [...prev.ipRules, newRule],
    }));
  }, []);

  const updateIpRule = useCallback((id: string, updates: Partial<IpRule>) => {
    setConfig((prev) => ({
      ...prev,
      ipRules: prev.ipRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  }, []);

  const removeIpRule = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      ipRules: prev.ipRules.filter((r) => r.id !== id),
    }));
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);

        addToHistory({
          id: crypto.randomUUID(),
          tool: 'htaccess-generator',
          input: JSON.stringify(config),
          output: text,
          timestamp: Date.now(),
        });
      } catch {
        console.error('Failed to copy');
      }
    },
    [addToHistory, config]
  );

  // Download file
  const downloadFile = useCallback(() => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.htaccess';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToHistory({
      id: crypto.randomUUID(),
      tool: 'htaccess-generator',
      input: JSON.stringify(config),
      output: output,
      timestamp: Date.now(),
    });
  }, [output, addToHistory, config]);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {labels.presets}
        </h3>
        <div className="flex flex-wrap gap-2">
          {HTACCESS_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.id)}
              className="text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
          icon={ShieldIcon}
        >
          {labels.security}
        </TabButton>
        <TabButton
          active={activeTab === 'redirects'}
          onClick={() => setActiveTab('redirects')}
          icon={LinkIcon}
        >
          {labels.redirects}
        </TabButton>
        <TabButton
          active={activeTab === 'caching'}
          onClick={() => setActiveTab('caching')}
          icon={ZapIcon}
        >
          {labels.caching}
        </TabButton>
        <TabButton
          active={activeTab === 'advanced'}
          onClick={() => setActiveTab('advanced')}
          icon={AlertTriangleIcon}
        >
          {labels.advanced}
        </TabButton>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.security}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle
              checked={config.security.forceHttps}
              onChange={(v) => updateSecurity('forceHttps', v)}
              label={labels.forceHttps}
              description={labels.forceHttpsDesc}
            />
            <Toggle
              checked={config.security.preventDirectoryListing}
              onChange={(v) => updateSecurity('preventDirectoryListing', v)}
              label={labels.preventDirListing}
              description={labels.preventDirListingDesc}
            />
            <Toggle
              checked={config.security.removeWww}
              onChange={(v) => updateSecurity('removeWww', v)}
              label={labels.removeWww}
              description={labels.removeWwwDesc}
            />
            <Toggle
              checked={config.security.addWww}
              onChange={(v) => updateSecurity('addWww', v)}
              label={labels.addWww}
              description={labels.addWwwDesc}
            />
            <Toggle
              checked={config.security.blockSensitiveFiles}
              onChange={(v) => updateSecurity('blockSensitiveFiles', v)}
              label={labels.blockSensitiveFiles}
              description={labels.blockSensitiveFilesDesc}
            />
            <Toggle
              checked={config.security.securityHeaders}
              onChange={(v) => updateSecurity('securityHeaders', v)}
              label={labels.securityHeaders}
              description={labels.securityHeadersDesc}
            />
            <Toggle
              checked={config.security.blockXmlRpc}
              onChange={(v) => updateSecurity('blockXmlRpc', v)}
              label={labels.blockXmlRpc}
              description={labels.blockXmlRpcDesc}
            />
            <Toggle
              checked={config.security.blockWpIncludes}
              onChange={(v) => updateSecurity('blockWpIncludes', v)}
              label={labels.blockWpIncludes}
              description={labels.blockWpIncludesDesc}
            />
          </div>
        </Card>
      )}

      {/* Redirects Tab */}
      {activeTab === 'redirects' && (
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {labels.redirects}
            </h3>
            <Button size="sm" onClick={addRedirect}>
              <PlusIcon className="mr-1 h-4 w-4" />
              {labels.addRedirect}
            </Button>
          </div>

          {config.redirects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {labels.noRedirects}
            </p>
          ) : (
            <div className="space-y-3">
              {config.redirects.map((redirect) => (
                <div
                  key={redirect.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <select
                    value={redirect.type}
                    onChange={(e) =>
                      updateRedirect(redirect.id, {
                        type: e.target.value as '301' | '302' | '303' | '307',
                      })
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="301">301 (Permanent)</option>
                    <option value="302">302 (Temporary)</option>
                    <option value="303">303 (See Other)</option>
                    <option value="307">307 (Temporary)</option>
                  </select>
                  <Input
                    value={redirect.from}
                    onChange={(e) =>
                      updateRedirect(redirect.id, { from: e.target.value })
                    }
                    placeholder="/old-page"
                    className="min-w-[150px] flex-1"
                  />
                  <span className="text-gray-500">→</span>
                  <Input
                    value={redirect.to}
                    onChange={(e) =>
                      updateRedirect(redirect.id, { to: e.target.value })
                    }
                    placeholder="/new-page or https://..."
                    className="min-w-[150px] flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRedirect(redirect.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Caching Tab */}
      {activeTab === 'caching' && (
        <Card className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.caching}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle
              checked={config.caching.enableCaching}
              onChange={(v) => updateCaching('enableCaching', v)}
              label={labels.enableCaching}
              description={labels.enableCachingDesc}
            />
            <Toggle
              checked={config.caching.enableGzip}
              onChange={(v) => updateCaching('enableGzip', v)}
              label={labels.enableGzip}
              description={labels.enableGzipDesc}
            />
            <Toggle
              checked={config.caching.enableBrotli}
              onChange={(v) => updateCaching('enableBrotli', v)}
              label={labels.enableBrotli}
              description={labels.enableBrotliDesc}
            />
          </div>

          {config.caching.enableCaching && (
            <div className="mt-4 grid gap-4 border-t pt-4 dark:border-gray-700 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm">
                  {labels.htmlCache} ({secondsToReadable(config.caching.htmlExpiry)})
                </Label>
                <select
                  value={config.caching.htmlExpiry}
                  onChange={(e) =>
                    updateCaching('htmlExpiry', Number(e.target.value))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value={CACHE_PRESETS.none}>{labels.noCache}</option>
                  <option value={CACHE_PRESETS.hour}>{labels.oneHour}</option>
                  <option value={CACHE_PRESETS.day}>{labels.oneDay}</option>
                  <option value={CACHE_PRESETS.week}>{labels.oneWeek}</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block text-sm">
                  {labels.cssJsCache} ({secondsToReadable(config.caching.cssJsExpiry)})
                </Label>
                <select
                  value={config.caching.cssJsExpiry}
                  onChange={(e) =>
                    updateCaching('cssJsExpiry', Number(e.target.value))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value={CACHE_PRESETS.week}>{labels.oneWeek}</option>
                  <option value={CACHE_PRESETS.month}>{labels.oneMonth}</option>
                  <option value={CACHE_PRESETS.year}>{labels.oneYear}</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block text-sm">
                  {labels.imageCache} ({secondsToReadable(config.caching.imageExpiry)})
                </Label>
                <select
                  value={config.caching.imageExpiry}
                  onChange={(e) =>
                    updateCaching('imageExpiry', Number(e.target.value))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value={CACHE_PRESETS.week}>{labels.oneWeek}</option>
                  <option value={CACHE_PRESETS.month}>{labels.oneMonth}</option>
                  <option value={CACHE_PRESETS.year}>{labels.oneYear}</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block text-sm">
                  {labels.fontCache} ({secondsToReadable(config.caching.fontExpiry)})
                </Label>
                <select
                  value={config.caching.fontExpiry}
                  onChange={(e) =>
                    updateCaching('fontExpiry', Number(e.target.value))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value={CACHE_PRESETS.month}>{labels.oneMonth}</option>
                  <option value={CACHE_PRESETS.year}>{labels.oneYear}</option>
                </select>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          {/* Error Pages */}
          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {labels.errorPages}
              </h3>
              <Button size="sm" onClick={addErrorPageHandler}>
                <PlusIcon className="mr-1 h-4 w-4" />
                {labels.addErrorPage}
              </Button>
            </div>

            {config.errorPages.length > 0 && (
              <div className="space-y-2">
                {config.errorPages.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <select
                      value={page.code}
                      onChange={(e) =>
                        updateErrorPage(index, { code: e.target.value })
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                    >
                      {ERROR_CODES.map((err) => (
                        <option key={err.code} value={err.code}>
                          {err.code} - {err.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={page.path}
                      onChange={(e) =>
                        updateErrorPage(index, { path: e.target.value })
                      }
                      placeholder="/404.html"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeErrorPage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* IP Rules */}
          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {labels.ipRules}
              </h3>
              <Button size="sm" onClick={addIpRuleHandler}>
                <PlusIcon className="mr-1 h-4 w-4" />
                {labels.addIpRule}
              </Button>
            </div>

            {config.ipRules.length > 0 && (
              <div className="space-y-2">
                {config.ipRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <select
                      value={rule.type}
                      onChange={(e) =>
                        updateIpRule(rule.id, {
                          type: e.target.value as 'allow' | 'deny',
                        })
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <option value="deny">{labels.deny}</option>
                      <option value="allow">{labels.allow}</option>
                    </select>
                    <Input
                      value={rule.ip}
                      onChange={(e) =>
                        updateIpRule(rule.id, { ip: e.target.value })
                      }
                      placeholder="192.168.1.1 or 192.168.1.0/24"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIpRule(rule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Custom Rules */}
          <Card className="space-y-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {labels.customRules}
            </h3>
            <textarea
              value={config.customRules}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, customRules: e.target.value }))
              }
              placeholder={labels.customRulesPlaceholder}
              className="min-h-[150px] w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </Card>
        </div>
      )}

      {/* Output */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.output}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(output, 'output')}
            >
              {copiedField === 'output' ? (
                <CheckIcon className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <CopyIcon className="mr-1 h-4 w-4" />
              )}
              {copiedField === 'output' ? labels.copied : labels.copy}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <DownloadIcon className="mr-1 h-4 w-4" />
              {labels.download}
            </Button>
          </div>
        </div>

        <pre className="max-h-[500px] overflow-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
          <code>{output}</code>
        </pre>
      </Card>
    </div>
  );
}
