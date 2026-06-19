import {
  FileJson2,
  ArrowDownUp,
  Table2,
  Database,
  CodeXml,
  FileCode2,
  Lock,
  Globe2,
  Code2,
  Hash,
  ShieldCheck,
  LockKeyhole,
  FileText,
  Film,
  Image,
  Camera,
  ImagePlus,
  FileSpreadsheet,
  Type,
  Linkedin,
  GitCompare,
  BookOpen,
  SearchCode,
  Fingerprint,
  KeyRound,
  QrCode,
  Barcode,
  Pipette,
  Palette,
  ImageDown,
  AppWindow,
  Blend,
  ClipboardCheck,
  CalendarClock,
  ListFilter,
  Terminal,
  Braces,
  FileType2,
  Zap,
  Replace,
  CheckSquare,
  Clock,
  Mail,
  Bot,
  BoxSelect,
  FileOutput,
  FileStack,
  Images,
  FileImage,
  Clapperboard,
  MessageSquare,
  BarChart2,
  Youtube,
  Shield,
  Server,
  PenLine,
  CaseSensitive,
  Binary,
  Code,
  FileCode,
  Sparkles,
  Share2,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps tool IDs to their Lucide icon components.
 * Used to render consistent SVG icons across the UI.
 * Note: tool.icon field still stores emojis for OG/Twitter image generation.
 */
export const toolIconMap: Record<string, LucideIcon> = {
  // Data & Conversion
  'json-formatter': FileJson2,
  'csv-to-json': ArrowDownUp,
  'json-to-csv': Table2,
  'sql-formatter': Database,
  'xml-formatter': CodeXml,
  'xml-to-json-converter': FileCode2,

  // Encoding & Security
  'base64-encode': Lock,
  'url-encode': Globe2,
  'html-encode-decode': Code2,
  'hash-generator': Hash,
  'jwt-decoder': ShieldCheck,
  'bcrypt-hash-generator': LockKeyhole,

  // Base64 converters
  'base64-to-pdf': FileText,
  'base64-to-gif': Film,
  'base64-to-png': Image,
  'base64-to-jpg': Camera,
  'base64-to-webp': ImagePlus,

  // Data tools
  'excel-filter': FileSpreadsheet,

  // Text & Format
  'instagram-font-generator': Type,
  'linkedin-post-formatter': Linkedin,
  'text-diff': GitCompare,
  'markdown-preview': BookOpen,
  'regex-tester': SearchCode,
  'lorem-ipsum-generator': PenLine,
  'string-case-converter': CaseSensitive,
  'word-counter': Type,
  'html-to-markdown': FileCode,

  // Generators
  'uuid-generator': Fingerprint,
  'password-generator': KeyRound,
  'qr-generator': QrCode,
  'barcode-generator': Barcode,

  // Web & Design
  'color-picker': Pipette,
  'color-format-converter': Palette,
  'image-optimizer': ImageDown,
  'favicon-generator': AppWindow,
  'gradient-generator': Blend,
  'css-box-shadow-generator': BoxSelect,

  // Dev Utilities
  'json-validator': ClipboardCheck,
  'crontab-builder': CalendarClock,
  'list-compare': ListFilter,
  'curl-to-axios': Terminal,
  'curl-to-code': Terminal,
  'curl-to-csharp': Terminal,
  'curl-to-go': Terminal,
  'curl-to-httpie': Terminal,
  'curl-to-httpx': Terminal,
  'curl-to-java': Terminal,
  'curl-to-php': Terminal,
  'curl-to-ruby': Terminal,
  'json-to-typescript': Braces,
  'css-minifier': FileType2,
  'js-minifier': Zap,
  'yaml-json-converter': Replace,
  'yaml-validator': CheckSquare,
  'unix-timestamp-converter': Clock,
  'eml-to-html': Mail,
  'ai-prompt-token-counter': Bot,
  'chmod-calculator': Shield,
  'htaccess-generator': Server,
  'binary-to-text': Binary,
  'js-object-to-json': Code,

  // PDF Tools
  'pdf-to-word': FileOutput,
  'pdf-to-jpg': FileImage,
  'pdf-merger-splitter': FileStack,
  'image-to-pdf': Images,
  'jpg-to-pdf': FileImage,
  'png-to-pdf': FileImage,
  'gif-to-pdf': Clapperboard,

  // Social Media
  'whatsapp-link-generator': MessageSquare,
  'utm-builder': BarChart2,
  'youtube-timestamp-generator': Youtube,
};

/**
 * Maps category IDs to their Lucide icon components.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  data: Database,
  encoding: ShieldCheck,
  base64: Lock,
  text: Type,
  generators: Sparkles,
  web: Globe2,
  dev: Terminal,
  formatters: Wand2,
  social: Share2,
  pdf: FileText,
};

/** Fallback icon when no mapping exists */
export const DefaultToolIcon: LucideIcon = FileText;

/** Get the Lucide icon component for a tool by its ID */
export function getToolIcon(toolId: string): LucideIcon {
  return toolIconMap[toolId] ?? DefaultToolIcon;
}

/** Get the Lucide icon component for a category by its ID */
export function getCategoryIcon(categoryId: string): LucideIcon {
  return categoryIconMap[categoryId] ?? DefaultToolIcon;
}
