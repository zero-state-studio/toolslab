'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { BaseToolProps } from '@/lib/types/tools';

// Loading component for tool implementations
function ToolLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Input section skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-4">
        <div className="h-10 w-24 rounded-lg bg-blue-200 dark:bg-blue-800"></div>
        <div className="h-10 w-16 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* Output section skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  );
}

// Lazy load all tool implementations
const toolComponents = {
  'json-formatter': lazy(() => import('./implementations/JsonFormatter')),
  'base64-encode': lazy(() => import('./implementations/Base64Tool')),
  'base64-to-pdf': lazy(() => import('./implementations/Base64ToPdfTool')),
  'base64-to-gif': lazy(() => import('./implementations/Base64ToGifTool')),
  'base64-to-png': lazy(() => import('./implementations/Base64ToPngTool')),
  'base64-to-jpg': lazy(() => import('./implementations/Base64ToJpgTool')),
  'base64-to-webp': lazy(() => import('./implementations/Base64ToWebpTool')),
  'hash-generator': lazy(() => import('./implementations/HashGenerator')),
  'uuid-generator': lazy(() => import('./implementations/UuidGenerator')),
  'password-generator': lazy(
    () => import('./implementations/PasswordGenerator')
  ),
  'regex-tester': lazy(() => import('./implementations/RegexTester')),
  'favicon-generator': lazy(() => import('./implementations/FaviconGenerator')),
  'crontab-builder': lazy(() => import('./implementations/CrontabBuilder')),
  'csv-to-json': lazy(() => import('./implementations/CsvToJsonTool')),
  'json-to-csv': lazy(() => import('./implementations/JsonToCsv')),
  'sql-formatter': lazy(() => import('./implementations/SqlFormatter')),
  'xml-formatter': lazy(() => import('./implementations/XmlFormatter')),
  'xml-to-json-converter': lazy(
    () => import('./implementations/XmlToJsonConverter')
  ),
  'jwt-decoder': lazy(() => import('./implementations/JwtDecoder')),
  'url-encode': lazy(() => import('./implementations/UrlEncoder')),
  'html-encode-decode': lazy(
    () => import('./implementations/HtmlEncodeDecode')
  ),
  'text-diff': lazy(() => import('./implementations/TextDiff')),
  'word-counter': lazy(() => import('./implementations/WordCounter')),
  'markdown-preview': lazy(() => import('./implementations/MarkdownPreview')),
  'qr-generator': lazy(() => import('./implementations/QRGenerator')),
  'barcode-generator': lazy(() => import('./implementations/BarcodeGenerator')),
  'color-picker': lazy(() => import('./implementations/ColorPicker')),
  'json-validator': lazy(() => import('./implementations/JSONValidator')),
  'list-compare': lazy(() => import('./implementations/ListCompare')),
  'gradient-generator': lazy(
    () => import('./implementations/GradientGenerator')
  ),
  'css-box-shadow-generator': lazy(
    () => import('./implementations/CssBoxShadowGenerator')
  ),
  'curl-to-axios': lazy(() => import('./implementations/CurlToAxios')),
  'curl-to-code': lazy(() => import('./implementations/CurlToCode')),
  'curl-to-csharp': lazy(() => import('./implementations/CurlToCsharp')),
  'curl-to-go': lazy(() => import('./implementations/CurlToGo')),
  'curl-to-httpie': lazy(() => import('./implementations/CurlToHttpie')),
  'curl-to-httpx': lazy(() => import('./implementations/CurlToHttpx')),
  'curl-to-java': lazy(() => import('./implementations/CurlToJava')),
  'curl-to-php': lazy(() => import('./implementations/CurlToPhp')),
  'curl-to-ruby': lazy(() => import('./implementations/CurlToRuby')),
  'json-to-typescript': lazy(
    () => import('./implementations/JsonToTypeScript')
  ),
  'unix-timestamp-converter': lazy(
    () => import('./implementations/UnixTimestampConverter')
  ),
  'css-minifier': lazy(() => import('./implementations/CSSMinifier')),
  'js-minifier': lazy(() => import('./implementations/JSMinifier')),
  'yaml-json-converter': lazy(
    () => import('./implementations/YamlJsonConverter')
  ),
  'eml-to-html': lazy(() => import('./implementations/EmlToHtml')),
  'instagram-font-generator': lazy(
    () => import('./implementations/InstagramFont')
  ),
  'excel-filter': lazy(() => import('./implementations/ExcelFilter')),
  'color-format-converter': lazy(
    () => import('./implementations/ColorConverter')
  ),
  'ai-prompt-token-counter': lazy(
    () => import('./implementations/AITokenCounter')
  ),
  'pdf-to-word': lazy(() => import('./implementations/PdfToWord')),
  'pdf-to-jpg': lazy(() => import('./implementations/PdfToJpg')),
  'merge-pdf': lazy(() => import('./implementations/MergePdf')),
  'split-pdf': lazy(() => import('./implementations/SplitPdf')),
  'image-to-pdf': lazy(() => import('./implementations/ImageToPdfTool')),
  'jpg-to-pdf': lazy(() => import('./implementations/JpgToPdfTool')),
  'png-to-pdf': lazy(() => import('./implementations/PngToPdfTool')),
  'gif-to-pdf': lazy(() => import('./implementations/GifToPdfTool')),
  'utm-builder': lazy(() => import('./implementations/UtmBuilder')),
  'whatsapp-link-generator': lazy(
    () => import('./implementations/WhatsAppLinkGenerator')
  ),
  'youtube-timestamp-generator': lazy(
    () => import('./implementations/YouTubeTimestampGenerator')
  ),
  'chmod-calculator': lazy(() => import('./implementations/ChmodCalculator')),
  'htaccess-generator': lazy(
    () => import('./implementations/HtaccessGenerator')
  ),
  'lorem-ipsum-generator': lazy(
    () => import('./implementations/LoremIpsumGenerator')
  ),
  'string-case-converter': lazy(
    () => import('./implementations/StringCaseConverter')
  ),
  'binary-to-text': lazy(() => import('./implementations/BinaryToText')),
  'number-base-converter': lazy(
    () => import('./implementations/NumberBaseConverter')
  ),
  'js-object-to-json': lazy(() => import('./implementations/JsObjectToJson')),
  'bcrypt-hash-generator': lazy(
    () => import('./implementations/BcryptHashGenerator')
  ),
  'linkedin-post-formatter': lazy(
    () => import('./implementations/LinkedInPostFormatter')
  ),
  'yaml-validator': lazy(() => import('./implementations/YamlValidator')),
  'html-to-markdown': lazy(() => import('./implementations/HtmlToMarkdown')),
  'markdown-table-generator': lazy(
    () => import('./implementations/MarkdownTableGenerator')
  ),
  'rot13-caesar-cipher': lazy(
    () => import('./implementations/Rot13CaesarCipher')
  ),
  // Add more as needed
} as const;

type ToolId = keyof typeof toolComponents;

interface LazyToolLoaderProps extends BaseToolProps {
  toolId: ToolId;
}

const LazyToolLoader = React.memo(function LazyToolLoader({
  toolId,
  ...props
}: LazyToolLoaderProps) {
  const ToolComponent = toolComponents[toolId];

  if (!ToolComponent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Tool not found: {toolId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ToolLoadingSkeleton />}>
      <ErrorBoundary>
        <ToolComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
});

export default LazyToolLoader;

// Error Boundary for tool loading
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tool loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="space-y-4 text-center">
            <p className="text-red-600 dark:text-red-400">
              Failed to load tool. This might be a temporary issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper to check if a tool supports lazy loading
export function isLazyLoadingSupported(toolId: string): toolId is ToolId {
  return toolId in toolComponents;
}

// Preload a specific tool component
export function preloadTool(toolId: ToolId) {
  const component = toolComponents[toolId];
  if (component && typeof window !== 'undefined') {
    // Trigger the dynamic import to preload
    void component;
  }
}

// Preload multiple tools
export function preloadTools(toolIds: ToolId[]) {
  toolIds.forEach(preloadTool);
}

// Hook to preload related tools
export function usePreloadRelatedTools(
  currentToolId: string,
  relatedTools: string[]
) {
  const supportedTools = relatedTools.filter(isLazyLoadingSupported);

  // Preload after a short delay to not interfere with current tool loading
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      preloadTools(supportedTools);
    }, 1000);
  }
}
