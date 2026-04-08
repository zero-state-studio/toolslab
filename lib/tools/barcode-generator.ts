import bwipjs from 'bwip-js/browser';

// Barcode format types
export type BarcodeFormat =
  // 1D Barcodes
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'upce'
  | 'code128'
  | 'code39'
  | 'code93'
  | 'itf14'
  | 'codabar'
  | 'msi'
  | 'pharmacode'
  | 'isbn'
  | 'issn'
  // 2D Barcodes
  | 'qrcode'
  | 'datamatrix'
  | 'pdf417'
  | 'azteccode'
  | 'maxicode';

// Output format types
export type OutputFormat = 'png' | 'svg' | 'pdf' | 'jpeg';

// Barcode options
export interface BarcodeOptions {
  format: BarcodeFormat;
  value: string;
  width?: number;
  height?: number;
  scale?: number;
  includetext?: boolean;
  textsize?: number;
  textcolor?: string;
  backgroundcolor?: string;
  barcolor?: string;
  rotate?: 'N' | 'R' | 'L' | 'I'; // Normal, Right (90°), Left (270°), Inverted (180°)
  paddingwidth?: number;
  paddingheight?: number;
  monochrome?: boolean;
  // QR Code specific options
  eclevel?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
}

// Barcode generation result
export interface BarcodeResult {
  success: boolean;
  dataUrl?: string;
  svg?: string;
  error?: string;
  metadata?: {
    format: BarcodeFormat;
    value: string;
    width: number;
    height: number;
  };
}

// Format metadata
export interface FormatMetadata {
  id: BarcodeFormat;
  name: string;
  category: '1D' | '2D' | 'Postal';
  description: string;
  charSet: string;
  minLength?: number;
  maxLength?: number;
  fixedLength?: number;
  hasChecksum: boolean;
  useCases: string[];
}

// All supported formats with metadata
export const BARCODE_FORMATS: FormatMetadata[] = [
  // 1D Barcodes - Code formats first
  {
    id: 'code128',
    name: 'Code 128',
    category: '1D',
    description:
      'High-density barcode supporting all ASCII characters - Best for alphanumeric data',
    charSet: 'Full ASCII (0-127)',
    minLength: 1,
    maxLength: 80,
    hasChecksum: true,
    useCases: [
      'Shipping labels',
      'Supply chain',
      'Warehouse management',
      'Serial numbers',
    ],
  },
  {
    id: 'code39',
    name: 'Code 39',
    category: '1D',
    description:
      'Alphanumeric barcode widely used in automotive and defense industries',
    charSet: 'A-Z, 0-9, and special characters (-. $/+%)',
    minLength: 1,
    maxLength: 43,
    hasChecksum: false,
    useCases: ['Automotive industry', 'Government applications', 'Healthcare'],
  },
  {
    id: 'code93',
    name: 'Code 93',
    category: '1D',
    description: 'Improved version of Code 39 with higher density',
    charSet: 'A-Z, 0-9, and special characters',
    minLength: 1,
    maxLength: 47,
    hasChecksum: true,
    useCases: ['Logistics', 'Inventory management', 'Retail'],
  },
  {
    id: 'ean13',
    name: 'EAN-13',
    category: '1D',
    description:
      'European Article Number - Standard for retail products in Europe',
    charSet: 'Numeric (0-9)',
    fixedLength: 13,
    hasChecksum: true,
    useCases: [
      'Retail product packaging',
      'Point of sale systems',
      'Inventory management',
    ],
  },
  {
    id: 'ean8',
    name: 'EAN-8',
    category: '1D',
    description: 'Compact version of EAN-13 for small products',
    charSet: 'Numeric (0-9)',
    fixedLength: 8,
    hasChecksum: true,
    useCases: ['Small product packaging', 'Limited space labels'],
  },
  {
    id: 'upca',
    name: 'UPC-A',
    category: '1D',
    description:
      'Universal Product Code - Standard for retail in USA and Canada',
    charSet: 'Numeric (0-9)',
    fixedLength: 12,
    hasChecksum: true,
    useCases: ['North American retail', 'Point of sale', 'Product tracking'],
  },
  {
    id: 'upce',
    name: 'UPC-E',
    category: '1D',
    description: 'Compact version of UPC-A for small products',
    charSet: 'Numeric (0-9)',
    fixedLength: 8,
    hasChecksum: true,
    useCases: ['Small packaging', 'Space-constrained labels'],
  },
  {
    id: 'itf14',
    name: 'ITF-14',
    category: '1D',
    description: 'Interleaved 2 of 5 - Used for packaging and cartons',
    charSet: 'Numeric (0-9)',
    fixedLength: 14,
    hasChecksum: true,
    useCases: ['Carton labeling', 'Packaging', 'Distribution', 'Case codes'],
  },
  {
    id: 'codabar',
    name: 'Codabar',
    category: '1D',
    description: 'Legacy barcode used in libraries and blood banks',
    charSet: '0-9, -$:/.+',
    minLength: 1,
    maxLength: 60,
    hasChecksum: false,
    useCases: ['Libraries', 'Blood banks', 'Photo labs', 'FedEx'],
  },
  {
    id: 'msi',
    name: 'MSI Plessey',
    category: '1D',
    description: 'Used for inventory control and warehouse shelving',
    charSet: 'Numeric (0-9)',
    minLength: 1,
    maxLength: 55,
    hasChecksum: true,
    useCases: ['Warehouse shelving', 'Inventory control', 'Retail'],
  },
  {
    id: 'pharmacode',
    name: 'Pharmacode',
    category: '1D',
    description: 'Pharmaceutical industry packaging barcode',
    charSet: 'Numeric (3-131070)',
    minLength: 1,
    maxLength: 6,
    hasChecksum: false,
    useCases: [
      'Pharmaceutical packaging',
      'Drug identification',
      'Quality control',
    ],
  },
  {
    id: 'isbn',
    name: 'ISBN',
    category: '1D',
    description: 'International Standard Book Number for books (include dashes, e.g. 978-0-306-40615-7)',
    charSet: 'Numeric (0-9) with dashes',
    hasChecksum: true,
    useCases: ['Book publishing', 'Library systems', 'Bookstores'],
  },
  {
    id: 'issn',
    name: 'ISSN',
    category: '1D',
    description: 'International Standard Serial Number for periodicals',
    charSet: 'Numeric (0-9)',
    minLength: 8,
    maxLength: 9,
    hasChecksum: true,
    useCases: ['Magazines', 'Journals', 'Newspapers', 'Periodicals'],
  },
  // 2D Barcodes
  {
    id: 'qrcode',
    name: 'QR Code',
    category: '2D',
    description:
      'Versatile 2D barcode with high data capacity and error correction',
    charSet: 'Numeric, Alphanumeric, Binary, Kanji',
    minLength: 1,
    maxLength: 4296,
    hasChecksum: true,
    useCases: [
      'URLs and links',
      'Product authentication',
      'Mobile payments',
      'WiFi credentials',
      'Business cards',
    ],
  },
  {
    id: 'datamatrix',
    name: 'Data Matrix',
    category: '2D',
    description:
      'Compact 2D barcode ideal for small items - Used in electronics and pharma',
    charSet: 'Full ASCII and binary',
    minLength: 1,
    maxLength: 3116,
    hasChecksum: true,
    useCases: [
      'Electronics manufacturing',
      'Pharmaceutical traceability',
      'Small component marking',
    ],
  },
  {
    id: 'pdf417',
    name: 'PDF417',
    category: '2D',
    description: 'High-capacity stacked barcode used in ID cards and transport',
    charSet: 'Full ASCII and binary',
    minLength: 1,
    maxLength: 1850,
    hasChecksum: true,
    useCases: [
      "Driver's licenses",
      'Boarding passes',
      'Postal services',
      'Government IDs',
    ],
  },
  {
    id: 'azteccode',
    name: 'Aztec Code',
    category: '2D',
    description: 'Compact 2D barcode used in transportation tickets',
    charSet: 'Full ASCII and binary',
    minLength: 1,
    maxLength: 3832,
    hasChecksum: true,
    useCases: ['Airline boarding passes', 'Train tickets', 'Event tickets'],
  },
  {
    id: 'maxicode',
    name: 'MaxiCode',
    category: '2D',
    description: 'Fixed-size barcode used by UPS for package sorting',
    charSet: 'Full ASCII',
    minLength: 1,
    maxLength: 138,
    hasChecksum: true,
    useCases: ['UPS shipping', 'Package sorting', 'Logistics'],
  },
];

/**
 * Generate barcode and return as data URL or SVG
 */
export async function generateBarcode(
  options: BarcodeOptions
): Promise<BarcodeResult> {
  try {
    const {
      format,
      value,
      width = 2,
      height = 50,
      scale = 5,
      includetext = true,
      textsize = 16, // Increased from 10 to 16 for readability
      textcolor = '000000',
      backgroundcolor = 'ffffff',
      barcolor = '000000',
      rotate = 'N',
      paddingwidth = 10,
      paddingheight = 10,
      monochrome = true,
      eclevel = 'M',
    } = options;

    // Validate input
    const validation = validateBarcodeInput(format, value);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Map format to bwip-js bcid
    const bcid = mapFormatToBcid(format);

    // Prepare bwip-js options
    const bwipOptions: any = {
      bcid,
      text: value,
      scale,
      height,
      includetext,
      textxalign: 'center',
      paddingwidth,
      paddingheight,
    };

    // Add format-specific options
    if (format === 'qrcode') {
      bwipOptions.eclevel = eclevel;
      delete bwipOptions.height; // QR codes are square
    }

    // Add color options (only for PNG)
    if (!monochrome) {
      bwipOptions.backgroundcolor = backgroundcolor;
      bwipOptions.barcolor = barcolor;
      bwipOptions.textcolor = textcolor;
    }

    // Add rotation
    if (rotate !== 'N') {
      bwipOptions.rotate = rotate;
    }

    // Add text size
    if (includetext && textsize !== 16) {
      bwipOptions.textsize = textsize;
    }

    // Add width for 1D barcodes
    if (!is2DFormat(format)) {
      bwipOptions.width = width;
    }

    // Generate barcode as PNG
    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, bwipOptions);

    const dataUrl = canvas.toDataURL('image/png');

    return {
      success: true,
      dataUrl,
      metadata: {
        format,
        value,
        width: canvas.width,
        height: canvas.height,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to generate barcode',
    };
  }
}

/**
 * Generate barcode as SVG string
 */
export async function generateBarcodeSVG(
  options: BarcodeOptions
): Promise<BarcodeResult & { svgString?: string }> {
  try {
    const {
      format,
      value,
      width = 2,
      height = 50,
      scale = 5,
      includetext = true,
      textsize = 16,
      textcolor = '000000',
      backgroundcolor = 'ffffff',
      barcolor = '000000',
      rotate = 'N',
      paddingwidth = 10,
      paddingheight = 10,
      monochrome = true,
      eclevel = 'M',
    } = options;

    const validation = validateBarcodeInput(format, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const bcid = mapFormatToBcid(format);

    const bwipOptions: any = {
      bcid,
      text: value,
      scale,
      height,
      includetext,
      textxalign: 'center',
      paddingwidth,
      paddingheight,
    };

    if (format === 'qrcode') {
      bwipOptions.eclevel = eclevel;
      delete bwipOptions.height;
    }
    if (!monochrome) {
      bwipOptions.backgroundcolor = backgroundcolor;
      bwipOptions.barcolor = barcolor;
      bwipOptions.textcolor = textcolor;
    }
    if (rotate !== 'N') bwipOptions.rotate = rotate;
    if (includetext && textsize !== 16) bwipOptions.textsize = textsize;
    if (!is2DFormat(format)) bwipOptions.width = width;

    const svgString = bwipjs.toSVG(bwipOptions);

    return {
      success: true,
      svgString,
      // width/height are not extracted from SVG string — consumers should use the image's intrinsic size
      metadata: { format, value, width: 0, height: 0 },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate SVG',
    };
  }
}

/**
 * Validate barcode input based on format specifications
 */
export function validateBarcodeInput(
  format: BarcodeFormat,
  value: string
): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Value is required' };
  }

  const metadata = BARCODE_FORMATS.find((f) => f.id === format);
  if (!metadata) {
    return { valid: false, error: 'Invalid barcode format' };
  }

  // Check length constraints
  if (metadata.fixedLength && value.length !== metadata.fixedLength) {
    return {
      valid: false,
      error: `${metadata.name} requires exactly ${metadata.fixedLength} characters`,
    };
  }

  if (metadata.minLength && value.length < metadata.minLength) {
    return {
      valid: false,
      error: `${metadata.name} requires at least ${metadata.minLength} characters`,
    };
  }

  if (metadata.maxLength && value.length > metadata.maxLength) {
    return {
      valid: false,
      error: `${metadata.name} allows maximum ${metadata.maxLength} characters`,
    };
  }

  // Validate character set for numeric-only formats
  const numericFormats: BarcodeFormat[] = [
    'ean13',
    'ean8',
    'upca',
    'upce',
    'itf14',
    'msi',
    'pharmacode',
    'isbn',
    'issn',
  ];

  if (numericFormats.includes(format) && !/^\d+$/.test(value)) {
    return {
      valid: false,
      error: `${metadata.name} only accepts numeric characters (0-9)`,
    };
  }

  return { valid: true };
}

/**
 * Calculate checksum for formats that support it
 */
export function calculateChecksum(
  format: BarcodeFormat,
  value: string
): string | null {
  switch (format) {
    case 'ean13':
    case 'ean8':
    case 'upca':
    case 'isbn':
    case 'issn':
      return calculateEANChecksum(value);

    case 'upce':
      return calculateUPCEChecksum(value);

    case 'code128':
      return 'Auto-calculated';

    default:
      return null;
  }
}

/**
 * Calculate EAN/UPC checksum
 */
function calculateEANChecksum(value: string): string {
  const digits = value.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < digits.length - 1; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const checksum = (10 - (sum % 10)) % 10;
  return checksum.toString();
}

/**
 * Calculate UPC-E checksum
 */
function calculateUPCEChecksum(value: string): string {
  // UPC-E uses same algorithm as UPC-A
  return calculateEANChecksum(value);
}

/**
 * Map our format names to bwip-js bcid values
 */
function mapFormatToBcid(format: BarcodeFormat): string {
  const mapping: Record<BarcodeFormat, string> = {
    ean13: 'ean13',
    ean8: 'ean8',
    upca: 'upca',
    upce: 'upce',
    code128: 'code128',
    code39: 'code39',
    code93: 'code93',
    itf14: 'itf14',
    codabar: 'codabar',
    msi: 'msi',
    pharmacode: 'pharmacode',
    isbn: 'isbn',
    issn: 'issn',
    qrcode: 'qrcode',
    datamatrix: 'datamatrix',
    pdf417: 'pdf417',
    azteccode: 'azteccode',
    maxicode: 'maxicode',
  };

  return mapping[format] || format;
}

/**
 * Check if format is 2D
 */
function is2DFormat(format: BarcodeFormat): boolean {
  const twoDFormats: BarcodeFormat[] = [
    'qrcode',
    'datamatrix',
    'pdf417',
    'azteccode',
    'maxicode',
  ];
  return twoDFormats.includes(format);
}

/**
 * Get format metadata
 */
export function getFormatMetadata(
  format: BarcodeFormat
): FormatMetadata | null {
  return BARCODE_FORMATS.find((f) => f.id === format) || null;
}

/**
 * Get all formats grouped by category
 */
export function getFormatsByCategory(): Record<string, FormatMetadata[]> {
  const grouped: Record<string, FormatMetadata[]> = {
    '1D': [],
    '2D': [],
    Postal: [],
  };

  BARCODE_FORMATS.forEach((format) => {
    grouped[format.category].push(format);
  });

  return grouped;
}

/**
 * Download barcode as file
 */
export function downloadBarcode(
  dataUrl: string,
  filename: string,
  format: OutputFormat = 'png'
) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download barcode as SVG file
 */
export function downloadSVG(svgString: string, filename: string) {
  if (!svgString) return;
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Batch generate barcodes from array of values
 */
export async function batchGenerateBarcodes(
  values: string[],
  options: Omit<BarcodeOptions, 'value'>
): Promise<BarcodeResult[]> {
  const results: BarcodeResult[] = [];

  for (const value of values) {
    const result = await generateBarcode({ ...options, value });
    results.push(result);
  }

  return results;
}

/**
 * Get optimal default dimensions for a barcode format
 * Note: For bwip-js, height is in modules/mm, not pixels
 * Final pixel height ≈ height * scale
 */
export function getOptimalDimensions(format: BarcodeFormat): {
  width: number;
  height: number;
  scale: number;
} {
  // 2D barcodes have different size requirements
  if (is2DFormat(format)) {
    return {
      width: 0, // Not used for 2D
      height: 50, // Module size for 2D codes
      scale: 5, // Standard scale
    };
  }

  // 1D barcodes - balanced for ~60px height with readable text
  // height in modules × scale = final pixels (12 × 5 = 60px)
  // width controls bar thickness
  const dimensionMap: Record<
    string,
    { width: number; height: number; scale: number }
  > = {
    // Code formats - ~60px height (12 modules × 5 scale)
    code128: { width: 3, height: 12, scale: 5 },
    code39: { width: 3, height: 12, scale: 5 },
    code93: { width: 3, height: 12, scale: 5 },

    // EAN/UPC - standard retail dimensions
    ean13: { width: 2, height: 12, scale: 5 },
    ean8: { width: 2, height: 11, scale: 5 },
    upca: { width: 2, height: 12, scale: 5 },
    upce: { width: 2, height: 11, scale: 5 },

    // ITF-14 - slightly larger for carton labels
    itf14: { width: 3, height: 13, scale: 5 },

    // ISBN/ISSN - similar to EAN
    isbn: { width: 2, height: 12, scale: 5 },
    issn: { width: 2, height: 12, scale: 5 },

    // Others
    codabar: { width: 2, height: 12, scale: 5 },
    msi: { width: 2, height: 12, scale: 5 },
    pharmacode: { width: 2, height: 10, scale: 5 },
  };

  return dimensionMap[format] || { width: 2, height: 12, scale: 5 };
}

export interface CharacterLimit {
  fixed?: number;
  min?: number;
  max?: number;
}

/**
 * Returns character limit info for a given format, or null if unlimited/variable.
 */
export function getCharacterLimit(format: BarcodeFormat): CharacterLimit | null {
  const meta = BARCODE_FORMATS.find((f) => f.id === format);
  if (!meta) return null;
  if (meta.fixedLength !== undefined) return { fixed: meta.fixedLength };
  if (meta.minLength !== undefined && meta.maxLength !== undefined) {
    return { min: meta.minLength, max: meta.maxLength };
  }
  return null;
}
