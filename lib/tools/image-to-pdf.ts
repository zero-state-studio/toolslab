/**
 * Image to PDF Converter
 * Converts multiple images (JPG, PNG, GIF, WebP) into a single PDF document
 */

// pdf-lib (~197KB gz) is loaded on demand inside imagesToPdf so the tool
// page doesn't pay for it until the user actually converts images.
import type { PDFDocument, PDFImage } from 'pdf-lib';

export interface ImageToPdfResult {
  success: boolean;
  error?: string;
  pdfBlob?: Blob;
  fileSize?: number;
  fileName?: string;
  metadata?: {
    pageCount: number;
    totalImages: number;
    pageSize: PageSize;
  };
}

export type PageSize = 'A4' | 'Letter' | 'A3' | 'Legal' | 'Tabloid' | 'Custom';

export type FitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface ImageToPdfOptions {
  fileName?: string;
  pageSize?: PageSize;
  customWidth?: number; // in points (1 point = 1/72 inch)
  customHeight?: number;
  fitMode?: FitMode;
  margins?: number; // in points
  quality?: number; // 0-100 (for JPG compression, not yet implemented)
}

export interface ImageFile {
  file: File;
  dataUrl: string;
}

// Page size definitions in points (1 point = 1/72 inch)
export const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 595, height: 842 }, // 210mm x 297mm
  Letter: { width: 612, height: 792 }, // 8.5" x 11"
  A3: { width: 842, height: 1191 }, // 297mm x 420mm
  Legal: { width: 612, height: 1008 }, // 8.5" x 14"
  Tabloid: { width: 792, height: 1224 }, // 11" x 17"
  Custom: { width: 0, height: 0 }, // Will be set by user
};

/**
 * Validates if a file is a supported image format
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  return supportedTypes.includes(file.type.toLowerCase());
}

/**
 * Converts File to ArrayBuffer for pdf-lib
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Embeds an image into the PDF document
 */
async function embedImage(
  pdfDoc: PDFDocument,
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<PDFImage> {
  const type = file.type.toLowerCase();

  if (type === 'image/jpeg' || type === 'image/jpg') {
    return await pdfDoc.embedJpg(arrayBuffer);
  } else if (type === 'image/png') {
    return await pdfDoc.embedPng(arrayBuffer);
  } else if (type === 'image/gif' || type === 'image/webp') {
    // For GIF and WebP, we need to convert to PNG first using Canvas
    // This is a browser-only approach
    return await embedImageViaCanvas(pdfDoc, file);
  }

  throw new Error(`Unsupported image format: ${type}`);
}

/**
 * Converts GIF/WebP to PNG using Canvas, then embeds in PDF
 */
async function embedImageViaCanvas(
  pdfDoc: PDFDocument,
  file: File
): Promise<PDFImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Convert to PNG blob
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/png')
        );
        if (!blob) {
          throw new Error('Failed to convert image to PNG');
        }

        // Convert blob to ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();

        // Embed PNG
        const pngImage = await pdfDoc.embedPng(arrayBuffer);

        URL.revokeObjectURL(url);
        resolve(pngImage);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculates image dimensions based on fit mode
 */
function calculateImageDimensions(
  imgWidth: number,
  imgHeight: number,
  pageWidth: number,
  pageHeight: number,
  fitMode: FitMode
): { width: number; height: number; x: number; y: number } {
  let width = imgWidth;
  let height = imgHeight;
  let x = 0;
  let y = 0;

  switch (fitMode) {
    case 'contain': {
      // Fit image inside page while maintaining aspect ratio
      const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      width = imgWidth * scale;
      height = imgHeight * scale;
      x = (pageWidth - width) / 2;
      y = (pageHeight - height) / 2;
      break;
    }

    case 'cover': {
      // Cover entire page while maintaining aspect ratio (may crop)
      const scale = Math.max(pageWidth / imgWidth, pageHeight / imgHeight);
      width = imgWidth * scale;
      height = imgHeight * scale;
      x = (pageWidth - width) / 2;
      y = (pageHeight - height) / 2;
      break;
    }

    case 'fill': {
      // Stretch to fill entire page (may distort)
      width = pageWidth;
      height = pageHeight;
      x = 0;
      y = 0;
      break;
    }

    case 'none': {
      // Use original image size, centered
      x = (pageWidth - imgWidth) / 2;
      y = (pageHeight - imgHeight) / 2;
      break;
    }
  }

  return { width, height, x, y };
}

/**
 * Main function: Converts multiple images to a single PDF
 */
export async function imagesToPdf(
  images: ImageFile[],
  options: ImageToPdfOptions = {}
): Promise<ImageToPdfResult> {
  try {
    // Validate inputs
    if (!images || images.length === 0) {
      return {
        success: false,
        error: 'No images provided. Please select at least one image.',
      };
    }

    // Validate all images
    for (const img of images) {
      if (!isSupportedImageFormat(img.file)) {
        return {
          success: false,
          error: `Unsupported image format: ${img.file.name}. Supported formats: JPG, PNG, GIF, WebP.`,
        };
      }
    }

    // Get page size
    const pageSize = options.pageSize || 'A4';
    let pageWidth =
      pageSize === 'Custom' && options.customWidth
        ? options.customWidth
        : PAGE_SIZES[pageSize].width;
    let pageHeight =
      pageSize === 'Custom' && options.customHeight
        ? options.customHeight
        : PAGE_SIZES[pageSize].height;

    // Apply margins
    const margins = options.margins || 0;
    const contentWidth = pageWidth - margins * 2;
    const contentHeight = pageHeight - margins * 2;

    if (contentWidth <= 0 || contentHeight <= 0) {
      return {
        success: false,
        error: 'Margins are too large for the selected page size.',
      };
    }

    // Create PDF document
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const fitMode = options.fitMode || 'contain';

    // Process each image
    for (const imageFile of images) {
      try {
        // Convert file to ArrayBuffer
        const arrayBuffer = await fileToArrayBuffer(imageFile.file);

        // Embed image in PDF
        const image = await embedImage(pdfDoc, imageFile.file, arrayBuffer);

        // Add page with specified size
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions
        const { width, height, x, y } = calculateImageDimensions(
          image.width,
          image.height,
          contentWidth,
          contentHeight,
          fitMode
        );

        // Draw image on page (with margins offset)
        page.drawImage(image, {
          x: x + margins,
          y: y + margins,
          width,
          height,
        });
      } catch (error) {
        console.error(`Failed to process image ${imageFile.file.name}:`, error);
        return {
          success: false,
          error: `Failed to process image: ${imageFile.file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Save PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Create blob - use slice() to create a copy with clean ArrayBuffer type
    const pdfBlob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });

    // Generate filename
    const fileName = options.fileName || `images_to_pdf_${Date.now()}.pdf`;

    return {
      success: true,
      pdfBlob,
      fileSize: pdfBytes.length,
      fileName,
      metadata: {
        pageCount: images.length,
        totalImages: images.length,
        pageSize,
      },
    };
  } catch (error) {
    console.error('Error converting images to PDF:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during conversion.',
    };
  }
}

/**
 * Downloads a blob as a file
 */
export function downloadPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
