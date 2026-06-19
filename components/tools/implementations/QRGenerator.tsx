'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Wifi,
  User,
  Mail,
  MessageSquare,
  MapPin,
  Bitcoin,
  Link,
  FileText,
  Settings,
  Camera,
  Code,
  Palette,
  AlertTriangle,
  Info,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { trackToolUse, trackEngagement } from '@/lib/analytics';
import { useToolStore } from '@/lib/store/toolStore';
import { useCopy } from '@/lib/hooks/useCopy';
import { BaseToolProps } from '@/lib/types/tools';
import {
  generateQRCode,
  generateBatchQRCodes,
  generateCurlCommand,
  qrTemplates,
  sizePresets,
  errorCorrectionInfo,
  type QRContentData,
  type QRGeneratorOptions,
  type QRGeneratorResult,
  type QRCodeType,
  type BatchQRItem,
} from '@/lib/tools/qr-generator';

interface QRGeneratorProps extends BaseToolProps {}

const contentTypeIcons: Record<QRCodeType, React.ElementType> = {
  text: FileText,
  url: Link,
  wifi: Wifi,
  vcard: User,
  email: Mail,
  sms: MessageSquare,
  geo: MapPin,
  crypto: Bitcoin,
};

export default function QRGenerator({
  categoryColor,
  dictionary,
}: QRGeneratorProps) {
  const ui = dictionary?.tools?.['qr-generator']?.ui ?? {};

  // Localized labels for data-driven options (EN falls back to source data)
  const sizePresetLabels: Record<string, string | undefined> = {
    small: ui.sizePresetSmall,
    medium: ui.sizePresetMedium,
    large: ui.sizePresetLarge,
    xlarge: ui.sizePresetXlarge,
    print: ui.sizePresetPrint,
  };
  const errorCorrectionDescriptions: Record<string, string | undefined> = {
    low: ui.errorCorrectionLow,
    medium: ui.errorCorrectionMedium,
    quartile: ui.errorCorrectionQuartile,
    high: ui.errorCorrectionHigh,
  };

  const { copy: copyToClipboard } = useCopy();
  const { addToHistory } = useToolStore();

  // Main state
  const [contentType, setContentType] = useState<QRCodeType>('text');
  const [qrResult, setQrResult] = useState<QRGeneratorResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<
    'preview' | 'code' | 'api'
  >('preview');

  // Content data
  const [contentData, setContentData] = useState<QRContentData>({
    type: 'text',
    text: '',
  });

  // Options
  const [options, setOptions] = useState<QRGeneratorOptions>({
    size: 256,
    margin: 4,
    errorCorrectionLevel: 'medium',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    format: 'png',
  });

  // UI state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<HTMLInputElement>(null);

  // Update content data when type changes
  useEffect(() => {
    const newData: QRContentData = { type: contentType };

    // Set default values based on type
    switch (contentType) {
      case 'text':
        newData.text = contentData.text || '';
        break;
      case 'url':
        newData.url = contentData.url || 'https://';
        break;
      case 'wifi':
        newData.ssid = contentData.ssid || '';
        newData.password = contentData.password || '';
        newData.security = contentData.security || 'WPA';
        newData.hidden = contentData.hidden || false;
        break;
      case 'vcard':
        newData.firstName = contentData.firstName || '';
        newData.lastName = contentData.lastName || '';
        newData.organization = contentData.organization || '';
        newData.phone = contentData.phone || '';
        newData.email = contentData.email || '';
        newData.website = contentData.website || '';
        break;
      case 'email':
        newData.emailTo = contentData.emailTo || '';
        newData.subject = contentData.subject || '';
        newData.body = contentData.body || '';
        break;
      case 'sms':
        newData.phoneNumber = contentData.phoneNumber || '';
        newData.message = contentData.message || '';
        break;
      case 'geo':
        newData.latitude = contentData.latitude || 0;
        newData.longitude = contentData.longitude || 0;
        break;
      case 'crypto':
        newData.cryptoAddress = contentData.cryptoAddress || '';
        newData.amount = contentData.amount;
        newData.label = contentData.label || '';
        newData.cryptoType = contentData.cryptoType || 'bitcoin';
        break;
    }

    setContentData(newData);
  }, [contentType]);

  // Handle logo file upload
  const handleLogoUpload = useCallback((file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      alert('Logo file must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setOptions((prev) => ({
        ...prev,
        logoImage: result,
        logoSize: prev.logoSize || 20,
      }));
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
  }, []);

  // Generate QR code
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const result = await generateQRCode(contentData, options);
      setQrResult(result);

      // Auto-tracking via store history (skip empty/failed)
      if (result.success) {
        const inputText = (contentData.text ||
          contentData.url ||
          contentData.ssid ||
          contentData.emailTo ||
          contentData.cryptoAddress ||
          contentType) as string;

        if (inputText && inputText.trim()) {
          const size = options.size || 256;
          const fmt = (options.format || 'png').toUpperCase();
          addToHistory({
            id: crypto.randomUUID(),
            tool: 'qr-generator',
            input: inputText,
            output: `QR ${fmt} ${size}x${size}`,
            timestamp: startTime,
          });
        }
      }

      // Track usage
      trackToolUse('qr-generator', 'generate', {
        contentType,
        format: options.format,
        size: options.size,
        errorLevel: options.errorCorrectionLevel,
        hasLogo: !!options.logoImage,
        success: result.success,
        readabilityScore: result.readabilityScore,
        processingTime: Date.now() - startTime,
      });

      if (!result.success) {
        trackEngagement('qr-generator-error');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      trackEngagement('qr-generator-error');
    } finally {
      setIsGenerating(false);
    }
  }, [
    contentData,
    options,
    trackToolUse,
    trackEngagement,
    contentType,
    addToHistory,
  ]);

  // Auto-generate on content/options change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentData.type && Object.keys(contentData).length > 1) {
        handleGenerate();
      }
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [contentData, options, handleGenerate]);

  // Download QR code
  const handleDownload = useCallback(
    (format: string = options.format || 'png') => {
      if (!qrResult?.qrCode) return;

      try {
        let dataUrl = qrResult.qrCode;
        let filename = `qrcode.${format}`;

        if (format === 'svg') {
          const blob = new Blob([qrResult.qrCode], { type: 'image/svg+xml' });
          dataUrl = URL.createObjectURL(blob);
        } else if (!qrResult.qrCode.startsWith('data:')) {
          // Convert base64 to data URL
          dataUrl = `data:image/${format};base64,${qrResult.qrCode}`;
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (format === 'svg') {
          URL.revokeObjectURL(dataUrl);
        }

        trackEngagement('qr-generator-download');
      } catch (error) {
        console.error('Download error:', error);
      }
    },
    [qrResult, options.format, trackEngagement]
  );

  // Copy to clipboard
  const handleCopy = useCallback(
    async (type: 'dataurl' | 'base64' | 'svg' = 'dataurl') => {
      if (!qrResult?.qrCode) return;

      let textToCopy = '';
      switch (type) {
        case 'dataurl':
          textToCopy = qrResult.qrCode.startsWith('data:')
            ? qrResult.qrCode
            : `data:image/${options.format || 'png'};base64,${qrResult.qrCode}`;
          break;
        case 'base64':
          textToCopy = qrResult.qrCode.replace(
            /^data:image\/[^;]+;base64,/,
            ''
          );
          break;
        case 'svg':
          textToCopy = qrResult.qrCode;
          break;
      }

      const success = await copyToClipboard(textToCopy);
      if (success) {
        trackEngagement('qr-generator-copy');
      }
    },
    [qrResult, options.format, trackEngagement]
  );

  // Apply template
  const applyTemplate = useCallback(
    (templateName: keyof typeof qrTemplates, ...args: any[]) => {
      // @ts-ignore - Template function call with dynamic args
      const template = (qrTemplates[templateName] as any)(...args);
      setContentType(template.type);
      setContentData(template);
      setShowTemplates(false);
      trackEngagement('qr-generator-template');
    },
    [trackEngagement]
  );

  // Render content type selector
  const renderContentTypeSelector = () => (
    <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
      {(Object.keys(contentTypeIcons) as QRCodeType[]).map((type) => {
        const Icon = contentTypeIcons[type];
        const isActive = contentType === type;

        return (
          <button
            key={type}
            onClick={() => setContentType(type)}
            className={`flex flex-col items-center rounded-md border p-2 transition-all ${
              isActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:hover:border-gray-400 dark:hover:bg-gray-500'
            }`}
          >
            <Icon
              className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
            />
            <span
              className={`mt-1 text-xs capitalize ${isActive ? 'font-medium text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
            >
              {type}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Render content input based on type
  const renderContentInput = () => {
    switch (contentType) {
      case 'text':
        return (
          <textarea
            value={contentData.text || ''}
            onChange={(e) =>
              setContentData((prev) => ({ ...prev, text: e.target.value }))
            }
            placeholder={ui.enterTextPlaceholder || 'Enter your text here...'}
            className="h-24 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={contentData.url || ''}
            onChange={(e) =>
              setContentData((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://example.com"
            className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        );

      case 'wifi':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={contentData.ssid || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, ssid: e.target.value }))
              }
              placeholder={ui.networkNamePlaceholder || 'Network Name (SSID)'}
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="password"
              value={contentData.password || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder={ui.passwordPlaceholder || 'Password'}
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <div className="flex gap-3">
              <select
                value={contentData.security || 'WPA'}
                onChange={(e) =>
                  setContentData((prev) => ({
                    ...prev,
                    security: e.target.value as 'WPA' | 'WEP' | 'nopass',
                  }))
                }
                className="flex-1 rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">
                  {ui.openNetwork || 'Open Network'}
                </option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={contentData.hidden || false}
                  onChange={(e) =>
                    setContentData((prev) => ({
                      ...prev,
                      hidden: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hidden
                </span>
              </label>
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              type="text"
              value={contentData.firstName || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              placeholder={ui.firstNamePlaceholder || 'First Name'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="text"
              value={contentData.lastName || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              placeholder={ui.lastNamePlaceholder || 'Last Name'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="text"
              value={contentData.organization || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  organization: e.target.value,
                }))
              }
              placeholder={ui.organizationPlaceholder || 'Organization'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="tel"
              value={contentData.phone || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder={ui.phoneNumberPlaceholder || 'Phone Number'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="email"
              value={contentData.email || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder={ui.emailAddressPlaceholder || 'Email Address'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="url"
              value={contentData.website || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder={ui.websitePlaceholder || 'Website'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-2">
            <input
              type="email"
              value={contentData.emailTo || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, emailTo: e.target.value }))
              }
              placeholder="recipient@example.com"
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="text"
              value={contentData.subject || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder={
                ui.emailSubjectPlaceholder || 'Email Subject (optional)'
              }
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <textarea
              value={contentData.body || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder={ui.emailBodyPlaceholder || 'Email Body (optional)'}
              className="h-20 w-full resize-none rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-2">
            <input
              type="tel"
              value={contentData.phoneNumber || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              placeholder="+1234567890"
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <textarea
              value={contentData.message || ''}
              onChange={(e) =>
                setContentData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder={ui.smsMessagePlaceholder || 'SMS Message (optional)'}
              className="h-20 w-full resize-none rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        );

      case 'geo':
        return (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              type="number"
              step="any"
              value={contentData.latitude || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  latitude: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder={ui.latitudePlaceholder || 'Latitude (e.g., 40.7128)'}
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="number"
              step="any"
              value={contentData.longitude || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  longitude: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder={
                ui.longitudePlaceholder || 'Longitude (e.g., -74.0060)'
              }
              className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        );

      case 'crypto':
        return (
          <div className="space-y-2">
            <select
              value={contentData.cryptoType || 'bitcoin'}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  cryptoType: e.target.value as
                    | 'bitcoin'
                    | 'ethereum'
                    | 'litecoin',
                }))
              }
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="bitcoin">Bitcoin</option>
              <option value="ethereum">Ethereum</option>
              <option value="litecoin">Litecoin</option>
            </select>
            <input
              type="text"
              value={contentData.cryptoAddress || ''}
              onChange={(e) =>
                setContentData((prev) => ({
                  ...prev,
                  cryptoAddress: e.target.value,
                }))
              }
              placeholder={
                ui.cryptoAddressPlaceholder || 'Cryptocurrency Address'
              }
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                type="number"
                step="any"
                min="0"
                value={contentData.amount || ''}
                onChange={(e) =>
                  setContentData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || undefined,
                  }))
                }
                placeholder={ui.amountPlaceholder || 'Amount (optional)'}
                className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <input
                type="text"
                value={contentData.label || ''}
                onChange={(e) =>
                  setContentData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder={ui.labelPlaceholder || 'Label (optional)'}
                className="rounded-md border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render advanced options
  const renderAdvancedOptions = () => (
    <div className="space-y-2">
      {/* Size and Error Correction */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {ui.sizePixels || 'Size (pixels)'}
          </label>
          <div className="mb-1 flex gap-1">
            {Object.entries(sizePresets).map(([name, size]) => (
              <button
                key={name}
                onClick={() => setOptions((prev) => ({ ...prev, size }))}
                className={`rounded px-2 py-1 text-xs ${
                  options.size === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                {sizePresetLabels[name] || name}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={options.size || 256}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                size: parseInt(e.target.value),
              }))
            }
            className="w-full"
          />
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {options.size || 256} × {options.size || 256} pixels
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {ui.errorCorrection || 'Error Correction'}
          </label>
          <select
            value={options.errorCorrectionLevel || 'medium'}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                errorCorrectionLevel: e.target.value as
                  | 'low'
                  | 'medium'
                  | 'quartile'
                  | 'high',
              }))
            }
            className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            {Object.entries(errorCorrectionInfo).map(([key, info]) => (
              <option key={key} value={key}>
                {info.level} ({info.recovery}) -{' '}
                {errorCorrectionDescriptions[key] || info.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Colors and Margin */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {ui.foregroundColor || 'Foreground Color'}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={options.foregroundColor || '#000000'}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  foregroundColor: e.target.value,
                }))
              }
              className="h-8 w-8 rounded border border-gray-300"
            />
            <input
              type="text"
              value={options.foregroundColor || '#000000'}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  foregroundColor: e.target.value,
                }))
              }
              placeholder="#000000"
              className="flex-1 rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {ui.backgroundColor || 'Background Color'}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={options.backgroundColor || '#FFFFFF'}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  backgroundColor: e.target.value,
                }))
              }
              className="h-8 w-8 rounded border border-gray-300"
            />
            <input
              type="text"
              value={options.backgroundColor || '#FFFFFF'}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  backgroundColor: e.target.value,
                }))
              }
              placeholder="#FFFFFF"
              className="flex-1 rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {ui.marginModules || 'Margin (modules)'}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={options.margin || 4}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                margin: parseInt(e.target.value),
              }))
            }
            className="w-full"
          />
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {options.margin || 4} modules
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {ui.logoOptional || 'Logo (optional)'}
        </label>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-gray-300 p-2 text-center transition-colors hover:border-blue-500 dark:border-gray-600"
            >
              <Upload className="mx-auto mb-1 h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {logoFile
                  ? logoFile.name
                  : ui.uploadLogo || 'Upload Logo (PNG, JPG, SVG)'}
              </span>
            </button>
          </div>

          {logoPreview && (
            <div className="space-y-1">
              <div className="h-12 w-12 overflow-hidden rounded-md border">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                  {ui.sizePercent || 'Size %'}
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={options.logoSize || 20}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      logoSize: parseInt(e.target.value),
                    }))
                  }
                  className="w-12"
                />
                <div className="text-center text-xs">
                  {options.logoSize || 20}%
                </div>
              </div>
              <button
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview('');
                  setOptions((prev) => ({
                    ...prev,
                    logoImage: undefined,
                    logoSize: undefined,
                  }));
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {ui.exportFormat || 'Export Format'}
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {['png', 'svg', 'base64', 'dataurl', 'pdf'].map((format) => (
            <button
              key={format}
              onClick={() =>
                setOptions((prev) => ({ ...prev, format: format as any }))
              }
              className={`rounded border px-2 py-1 text-xs ${
                options.format === format
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render QR preview and results
  const renderQRPreview = () => {
    if (!qrResult) {
      return (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <QrCode className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {ui.qrWillAppearHere || 'QR Code will appear here'}
            </p>
          </div>
        </div>
      );
    }

    if (!qrResult.success) {
      return (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-red-300">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-red-500" />
            <p className="text-red-600">{qrResult.error}</p>
          </div>
        </div>
      );
    }

    const tabs = [
      { id: 'preview', label: 'Preview', icon: Eye },
      { id: 'code', label: 'Code', icon: Code },
      { id: 'api', label: 'API', icon: Zap },
    ];

    return (
      <div className="space-y-3">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPreviewFormat(id as any)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 ${
                previewFormat === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Preview Content */}
        {previewFormat === 'preview' && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
                {options.format === 'svg' ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrResult.qrCode || '' }}
                    className="flex justify-center"
                  />
                ) : (
                  <img
                    src={
                      qrResult.qrCode && qrResult.qrCode.startsWith('data:')
                        ? qrResult.qrCode
                        : `data:image/png;base64,${qrResult.qrCode || ''}`
                    }
                    alt="Generated QR Code"
                    className="h-auto max-w-full"
                    style={{ maxWidth: Math.min(options.size || 256, 400) }}
                  />
                )}
              </div>
            </div>

            {/* QR Info */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Size:
                  </span>
                  <div className="font-mono">
                    {qrResult.size?.width} × {qrResult.size?.height}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Format:
                  </span>
                  <div className="font-mono">
                    {qrResult.format?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {ui.readability || 'Readability:'}
                  </span>
                  <div
                    className={`font-mono ${
                      (qrResult.readabilityScore || 0) >= 80
                        ? 'text-green-600'
                        : (qrResult.readabilityScore || 0) >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {qrResult.readabilityScore}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Version:
                  </span>
                  <div className="font-mono">{qrResult.metadata?.version}</div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {qrResult.warnings && qrResult.warnings.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Warnings
                    </h4>
                    <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      {qrResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {previewFormat === 'code' && (
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {ui.dataUrl || 'Data URL'}
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  value={
                    qrResult.qrCode && qrResult.qrCode.startsWith('data:')
                      ? qrResult.qrCode
                      : `data:image/${options.format || 'png'};base64,${qrResult.qrCode || ''}`
                  }
                  className="h-20 w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-700"
                />
                <button
                  onClick={() => handleCopy('dataurl')}
                  className="absolute right-2 top-2 rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {options.format === 'svg' && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {ui.svgCode || 'SVG Code'}
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={qrResult.qrCode || ''}
                    className="h-32 w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-700"
                  />
                  <button
                    onClick={() => handleCopy('svg')}
                    className="absolute right-2 top-2 rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {previewFormat === 'api' && (
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                cURL Command
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  value={generateCurlCommand(contentData, options)}
                  className="h-20 w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-700"
                />
                <button
                  onClick={async () =>
                    await copyToClipboard(
                      generateCurlCommand(contentData, options)
                    )
                  }
                  className="absolute right-2 top-2 rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleDownload()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download {options.format?.toUpperCase() || 'PNG'}
          </button>

          <button
            onClick={() => handleCopy('dataurl')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <Copy className="h-4 w-4" />
            {ui.copyDataUrl || 'Copy Data URL'}
          </button>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
            />
            {ui.regenerate || 'Regenerate'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Content Type Selection */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-lg font-medium">
          {ui.contentType || 'Content Type'}
        </h3>
        {renderContentTypeSelector()}
      </div>

      {/* Content Input */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium capitalize">
            {contentType} Content
          </h3>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {ui.useTemplate || 'Use Template'}
          </button>
        </div>

        {/* Templates */}
        {showTemplates && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="mb-2 font-medium">
              {ui.quickTemplates || 'Quick Templates'}
            </h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <button
                onClick={() => applyTemplate('wifiHome')}
                className="rounded border bg-white p-2 text-left text-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Wifi className="mr-2 inline h-4 w-4" />
                {ui.homeWifi || 'Home WiFi'}
              </button>
              <button
                onClick={() => applyTemplate('businessCard')}
                className="rounded border bg-white p-2 text-left text-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <User className="mr-2 inline h-4 w-4" />
                {ui.businessCard || 'Business Card'}
              </button>
              <button
                onClick={() => applyTemplate('localhost', 3000)}
                className="rounded border bg-white p-2 text-left text-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Link className="mr-2 inline h-4 w-4" />
                Localhost:3000
              </button>
            </div>
          </div>
        )}

        {renderContentInput()}
      </div>

      {/* Advanced Options */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between p-3 text-left"
        >
          <h3 className="text-base font-medium">
            {ui.advancedOptions || 'Advanced Options'}
          </h3>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showAdvanced && (
          <div className="border-t border-gray-200 px-3 pb-3 pt-3 dark:border-gray-700">
            {renderAdvancedOptions()}
          </div>
        )}
      </div>

      {/* QR Code Preview */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-lg font-medium">
          {ui.generatedQrCode || 'Generated QR Code'}
        </h3>
        {renderQRPreview()}
      </div>

      {/* Loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex items-center gap-4 rounded-lg bg-white p-6 dark:bg-gray-800">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span>{ui.generatingQrCode || 'Generating QR Code...'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
