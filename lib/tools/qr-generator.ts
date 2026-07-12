import QRCode from 'qrcode';

export interface QRGeneratorOptions {
  type?: QRCodeType;
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
  foregroundColor?: string;
  backgroundColor?: string;
  format?: 'png' | 'svg' | 'base64' | 'dataurl' | 'pdf';
  logoImage?: string; // base64 image data
  logoSize?: number; // percentage (0-30)
}

export type QRCodeType =
  | 'text'
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'geo'
  | 'crypto';

export interface QRContentData {
  type: QRCodeType;
  // Text
  text?: string;
  // URL
  url?: string;
  // WiFi
  ssid?: string;
  password?: string;
  security?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
  // vCard
  firstName?: string;
  lastName?: string;
  organization?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Email
  emailTo?: string;
  subject?: string;
  body?: string;
  // SMS
  phoneNumber?: string;
  message?: string;
  // Geo
  latitude?: number;
  longitude?: number;
  // Crypto
  cryptoAddress?: string;
  amount?: number;
  label?: string;
  cryptoType?: 'bitcoin' | 'ethereum' | 'litecoin';
}

export interface QRGeneratorResult {
  success: boolean;
  qrCode?: string;
  format?: string;
  size?: { width: number; height: number };
  readabilityScore?: number;
  warnings?: string[];
  error?: string;
  metadata?: {
    contentLength: number;
    moduleCount: number;
    version: number;
    errorCorrection: string;
  };
}

export interface BatchQRItem {
  id: string;
  content: QRContentData;
  options: QRGeneratorOptions;
  filename?: string;
}

export interface BatchQRResult {
  success: boolean;
  results: Array<{
    id: string;
    qrCode?: string;
    error?: string;
    filename?: string;
  }>;
  totalGenerated: number;
  errors: number;
}

// Error correction level mapping
const errorCorrectionMap = {
  low: 'L',
  medium: 'M',
  quartile: 'Q',
  high: 'H',
} as const;

// Content type generators
export function generateTextContent(data: QRContentData): string {
  return data.text || '';
}

export function generateUrlContent(data: QRContentData): string {
  if (!data.url) return '';

  // Add protocol if missing
  let url = data.url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

export function generateWifiContent(data: QRContentData): string {
  if (!data.ssid) return '';

  const security = data.security || 'WPA';
  const password = data.password || '';
  const hidden = data.hidden ? 'true' : 'false';

  return `WIFI:T:${security};S:${data.ssid};P:${password};H:${hidden};;`;
}

export function generateVCardContent(data: QRContentData): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  if (data.firstName || data.lastName) {
    const name = `${data.lastName || ''},${data.firstName || ''}`;
    lines.push(`N:${name}`);
    lines.push(`FN:${data.firstName || ''} ${data.lastName || ''}`.trim());
  }

  if (data.organization) {
    lines.push(`ORG:${data.organization}`);
  }

  if (data.phone) {
    lines.push(`TEL:${data.phone}`);
  }

  if (data.email) {
    lines.push(`EMAIL:${data.email}`);
  }

  if (data.website) {
    let url = data.website;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    lines.push(`URL:${url}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function generateEmailContent(data: QRContentData): string {
  if (!data.emailTo) return '';

  let mailto = `mailto:${data.emailTo}`;
  const params: string[] = [];

  if (data.subject) {
    params.push(`subject=${encodeURIComponent(data.subject)}`);
  }

  if (data.body) {
    params.push(`body=${encodeURIComponent(data.body)}`);
  }

  if (params.length > 0) {
    mailto += `?${params.join('&')}`;
  }

  return mailto;
}

export function generateSmsContent(data: QRContentData): string {
  if (!data.phoneNumber) return '';

  let sms = `sms:${data.phoneNumber}`;
  if (data.message) {
    sms += `?body=${encodeURIComponent(data.message)}`;
  }

  return sms;
}

export function generateGeoContent(data: QRContentData): string {
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    return '';
  }

  return `geo:${data.latitude},${data.longitude}`;
}

export function generateCryptoContent(data: QRContentData): string {
  if (!data.cryptoAddress) return '';

  const cryptoType = data.cryptoType || 'bitcoin';
  let uri = '';

  switch (cryptoType) {
    case 'bitcoin':
      uri = `bitcoin:${data.cryptoAddress}`;
      break;
    case 'ethereum':
      uri = `ethereum:${data.cryptoAddress}`;
      break;
    case 'litecoin':
      uri = `litecoin:${data.cryptoAddress}`;
      break;
    default:
      uri = data.cryptoAddress;
  }

  const params: string[] = [];
  if (data.amount) {
    params.push(`amount=${data.amount}`);
  }
  if (data.label) {
    params.push(`label=${encodeURIComponent(data.label)}`);
  }

  if (params.length > 0) {
    uri += `?${params.join('&')}`;
  }

  return uri;
}

// Main content generator
export function generateQRContent(data: QRContentData): string {
  switch (data.type) {
    case 'text':
      return generateTextContent(data);
    case 'url':
      return generateUrlContent(data);
    case 'wifi':
      return generateWifiContent(data);
    case 'vcard':
      return generateVCardContent(data);
    case 'email':
      return generateEmailContent(data);
    case 'sms':
      return generateSmsContent(data);
    case 'geo':
      return generateGeoContent(data);
    case 'crypto':
      return generateCryptoContent(data);
    default:
      return '';
  }
}

// Validation functions
export function validateQRContent(data: QRContentData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (data.type) {
    case 'text':
      if (!data.text?.trim()) {
        errors.push('Text content is required');
      }
      break;

    case 'url':
      if (!data.url?.trim()) {
        errors.push('URL is required');
      } else {
        try {
          // Any explicit URI scheme (http, ftp, file, ...) is taken as-is
          const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(data.url);
          const url = hasScheme ? data.url : `https://${data.url}`;
          const parsed = new URL(url);
          // Without an explicit scheme, require a dotted hostname (or
          // localhost): auto-prefixing makes any bare word like
          // "not-a-url" parse as a valid URL otherwise.
          if (
            !hasScheme &&
            !parsed.hostname.includes('.') &&
            parsed.hostname !== 'localhost'
          ) {
            errors.push('Invalid URL format');
          }
        } catch {
          errors.push('Invalid URL format');
        }
      }
      break;

    case 'wifi':
      if (!data.ssid?.trim()) {
        errors.push('WiFi SSID is required');
      }
      if (data.security && !['WPA', 'WEP', 'nopass'].includes(data.security)) {
        errors.push('Invalid WiFi security type');
      }
      break;

    case 'vcard':
      if (!data.firstName?.trim() && !data.lastName?.trim()) {
        errors.push('At least first name or last name is required for vCard');
      }
      break;

    case 'email':
      if (!data.emailTo?.trim()) {
        errors.push('Email address is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailTo)) {
        errors.push('Invalid email address format');
      }
      break;

    case 'sms':
      if (!data.phoneNumber?.trim()) {
        errors.push('Phone number is required');
      }
      break;

    case 'geo':
      if (
        typeof data.latitude !== 'number' ||
        typeof data.longitude !== 'number'
      ) {
        errors.push('Valid latitude and longitude are required');
      } else {
        if (data.latitude < -90 || data.latitude > 90) {
          errors.push('Latitude must be between -90 and 90');
        }
        if (data.longitude < -180 || data.longitude > 180) {
          errors.push('Longitude must be between -180 and 180');
        }
      }
      break;

    case 'crypto':
      if (!data.cryptoAddress?.trim()) {
        errors.push('Cryptocurrency address is required');
      }
      if (data.amount && data.amount <= 0) {
        errors.push('Amount must be greater than 0');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// Readability score calculation
export function calculateReadabilityScore(
  content: string,
  options: QRGeneratorOptions
): number {
  let score = 100;

  // Content length penalty
  if (content.length > 100) score -= 10;
  if (content.length > 300) score -= 20;
  if (content.length > 500) score -= 30;

  // Size factor
  const size = options.size || 256;
  if (size < 128) score -= 20;
  if (size < 100) score -= 30;

  // Error correction bonus
  const errorLevel = options.errorCorrectionLevel || 'medium';
  if (errorLevel === 'high') score += 10;
  if (errorLevel === 'low') score -= 10;

  // Color contrast (basic check)
  const fg = options.foregroundColor || '#000000';
  const bg = options.backgroundColor || '#FFFFFF';
  if (fg === bg) score -= 50;
  if (fg === '#808080' || bg === '#808080') score -= 15;

  // Logo penalty
  if (options.logoImage) {
    const logoSize = options.logoSize || 20;
    if (logoSize > 30) score -= 20;
    if (logoSize > 25) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

// Add logo to QR code SVG
export function addLogoToSVG(
  svgContent: string,
  logoData: string,
  logoSize: number
): string {
  try {
    // Parse SVG dimensions
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return svgContent;

    const [, , , width, height] = viewBoxMatch[1].split(' ').map(Number);

    // Calculate logo dimensions and position
    const logoWidth = width * (logoSize / 100);
    const logoHeight = logoWidth; // Keep square
    const logoX = (width - logoWidth) / 2;
    const logoY = (height - logoHeight) / 2;

    // Insert logo before closing </svg>
    const logoElement = `
    <g>
      <rect x="${logoX - 2}" y="${logoY - 2}" width="${logoWidth + 4}" height="${logoHeight + 4}" fill="white" rx="4"/>
      <image x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" href="${logoData}" preserveAspectRatio="xMidYMid meet"/>
    </g>
  </svg>`;

    return svgContent.replace('</svg>', logoElement);
  } catch (error) {
    console.warn('Failed to add logo to SVG:', error);
    return svgContent;
  }
}

// Main QR generation function
export async function generateQRCode(
  contentData: QRContentData,
  options: QRGeneratorOptions = {}
): Promise<QRGeneratorResult> {
  try {
    // Validate content
    const validation = validateQRContent(contentData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Generate content string
    const content = generateQRContent(contentData);
    if (!content) {
      return {
        success: false,
        error: 'Failed to generate content string',
      };
    }

    // Set up QR options
    const qrOptions = {
      errorCorrectionLevel:
        errorCorrectionMap[options.errorCorrectionLevel || 'medium'],
      width: options.size || 256,
      margin: options.margin || 4,
      color: {
        dark: options.foregroundColor || '#000000',
        light: options.backgroundColor || '#FFFFFF',
      },
    };

    // Generate QR code
    let qrCode: string;
    const format = options.format || 'png';

    switch (format) {
      case 'svg':
        qrCode = await QRCode.toString(content, { ...qrOptions, type: 'svg' });
        // Add logo if provided
        if (options.logoImage && options.logoSize) {
          qrCode = addLogoToSVG(qrCode, options.logoImage, options.logoSize);
        }
        break;

      case 'base64':
        qrCode = await QRCode.toDataURL(content, {
          ...qrOptions,
          type: 'image/png',
        });
        qrCode = qrCode.replace('data:image/png;base64,', '');
        break;

      case 'dataurl':
        qrCode = await QRCode.toDataURL(content, {
          ...qrOptions,
          type: 'image/png',
        });
        break;

      case 'pdf':
        // For PDF, we generate SVG first and let the client handle PDF conversion
        qrCode = await QRCode.toString(content, { ...qrOptions, type: 'svg' });
        if (options.logoImage && options.logoSize) {
          qrCode = addLogoToSVG(qrCode, options.logoImage, options.logoSize);
        }
        break;

      default: // PNG
        qrCode = await QRCode.toDataURL(content, {
          ...qrOptions,
          type: 'image/png',
        });
        break;
    }

    // Calculate readability score
    const readabilityScore = calculateReadabilityScore(content, options);

    // Generate warnings
    const warnings: string[] = [];
    if (content.length > 300) {
      warnings.push('Long content may reduce scannability');
    }
    if ((options.size || 256) < 128) {
      warnings.push('Small size may reduce scannability on mobile devices');
    }
    if (options.logoSize && options.logoSize > 25) {
      warnings.push('Large logo may interfere with QR code readability');
    }
    if (readabilityScore < 70) {
      warnings.push('Low readability score - consider adjusting settings');
    }

    // Get metadata
    const qrInstance = QRCode.create(content, {
      errorCorrectionLevel: qrOptions.errorCorrectionLevel,
    });

    return {
      success: true,
      qrCode,
      format,
      size: { width: qrOptions.width, height: qrOptions.width },
      readabilityScore,
      warnings,
      metadata: {
        contentLength: content.length,
        moduleCount: qrInstance.modules.size,
        version: qrInstance.version,
        errorCorrection: qrOptions.errorCorrectionLevel,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Batch generation
export async function generateBatchQRCodes(
  items: BatchQRItem[]
): Promise<BatchQRResult> {
  const results: BatchQRResult['results'] = [];
  let errors = 0;

  for (const item of items) {
    try {
      const result = await generateQRCode(item.content, item.options);

      if (result.success) {
        results.push({
          id: item.id,
          qrCode: result.qrCode,
          filename:
            item.filename || `qr-${item.id}.${item.options.format || 'png'}`,
        });
      } else {
        results.push({
          id: item.id,
          error: result.error,
        });
        errors++;
      }
    } catch (error) {
      results.push({
        id: item.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors++;
    }
  }

  return {
    success: errors === 0,
    results,
    totalGenerated: results.filter((r) => r.qrCode).length,
    errors,
  };
}

// Preset templates
export const qrTemplates = {
  // WiFi templates
  wifiHome: (): QRContentData => ({
    type: 'wifi',
    ssid: 'Home-WiFi',
    password: '',
    security: 'WPA',
  }),

  wifiGuest: (): QRContentData => ({
    type: 'wifi',
    ssid: 'Guest-Network',
    password: 'welcome123',
    security: 'WPA',
  }),

  // Social media templates
  instagramProfile: (username: string): QRContentData => ({
    type: 'url',
    url: `https://instagram.com/${username}`,
  }),

  linkedinProfile: (username: string): QRContentData => ({
    type: 'url',
    url: `https://linkedin.com/in/${username}`,
  }),

  // Business card template
  businessCard: (): QRContentData => ({
    type: 'vcard',
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Company Inc.',
    phone: '+1234567890',
    email: 'john.doe@company.com',
    website: 'https://company.com',
  }),

  // Development templates
  localhost: (port = 3000): QRContentData => ({
    type: 'url',
    url: `http://localhost:${port}`,
  }),

  apiEndpoint: (endpoint: string): QRContentData => ({
    type: 'url',
    url: `https://api.example.com${endpoint}`,
  }),
};

// Utility functions
export function getQRCodeApiUrl(
  content: QRContentData,
  options: QRGeneratorOptions
): string {
  const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
  const params = new URLSearchParams({
    data: generateQRContent(content),
    size: `${options.size || 256}x${options.size || 256}`,
    ecc: errorCorrectionMap[options.errorCorrectionLevel || 'medium'],
    format: options.format === 'svg' ? 'svg' : 'png',
  });

  if (options.foregroundColor) {
    params.set('color', options.foregroundColor.replace('#', ''));
  }
  if (options.backgroundColor) {
    params.set('bgcolor', options.backgroundColor.replace('#', ''));
  }
  if (options.margin) {
    params.set('qzone', options.margin.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

export function generateCurlCommand(
  content: QRContentData,
  options: QRGeneratorOptions
): string {
  const url = getQRCodeApiUrl(content, options);
  return `curl -o qrcode.${options.format || 'png'} "${url}"`;
}

// Export size presets
export const sizePresets = {
  small: 128,
  medium: 256,
  large: 512,
  xlarge: 1024,
  print: 2048,
} as const;

// Error correction level info
export const errorCorrectionInfo = {
  low: {
    level: 'L',
    recovery: '~7%',
    description: 'Low - Good for clean environments',
  },
  medium: {
    level: 'M',
    recovery: '~15%',
    description: 'Medium - Balanced for most uses',
  },
  quartile: {
    level: 'Q',
    recovery: '~25%',
    description: 'Quartile - Good for outdoor use',
  },
  high: {
    level: 'H',
    recovery: '~30%',
    description: 'High - Best for harsh environments',
  },
} as const;
