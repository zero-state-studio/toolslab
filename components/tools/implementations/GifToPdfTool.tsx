'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Download,
  Loader2,
  AlertCircle,
  Upload,
  X,
  FileText,
  ChevronUp,
  ChevronDown,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  imagesToPdf,
  ImageFile,
  ImageToPdfOptions,
  PageSize,
  FitMode,
  PAGE_SIZES,
  formatFileSize,
  downloadPdf,
} from '@/lib/tools/image-to-pdf';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

interface GifToPdfToolProps {
  categoryColor: string;
  dictionary?: any;
}

export default function GifToPdfTool({ categoryColor, dictionary }: GifToPdfToolProps) {
  const ui = dictionary?.tools?.['gif-to-pdf']?.ui ?? {};
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfMetadata, setPdfMetadata] = useState<{
    pageCount: number;
    fileSize: number;
    fileName: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [margins, setMargins] = useState(20);
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trackCustom, trackError } = useToolTracking('gif-to-pdf');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  useEffect(() => {
    if (pdfBlob) {
      scrollToResult();
    }
  }, [pdfBlob, scrollToResult]);

  useEffect(() => {
    if (!fileName) {
      const timestamp = new Date().toISOString().split('T')[0];
      setFileName(`gif_to_pdf_${timestamp}.pdf`);
    }
  }, [fileName]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate GIF only
      if (
        file.type !== 'image/gif' &&
        !file.name.toLowerCase().endsWith('.gif')
      ) {
        setError(`${file.name} is not a GIF file`);
        continue;
      }

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({ file, dataUrl });
    }

    setImages((prev) => [...prev, ...newImages]);
    setError(null);
    setPdfBlob(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [
        newImages[index],
        newImages[index - 1],
      ];
      return newImages;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setImages((prev) => {
      if (index === prev.length - 1) return prev;
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [
        newImages[index + 1],
        newImages[index],
      ];
      return newImages;
    });
  }, []);

  const handleGeneratePdf = useCallback(async () => {
    if (images.length === 0) {
      setError('Please add at least one GIF image');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      const options: ImageToPdfOptions = {
        fileName,
        pageSize,
        customWidth: pageSize === 'Custom' ? customWidth : undefined,
        customHeight: pageSize === 'Custom' ? customHeight : undefined,
        fitMode,
        margins,
      };

      const result = await imagesToPdf(images, options);

      if (result.success && result.pdfBlob) {
        // Cleanup old preview URL if exists
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPdfBlob(result.pdfBlob);
        setPdfMetadata({
          pageCount: result.metadata?.pageCount || 0,
          fileSize: result.fileSize || 0,
          fileName: result.fileName || fileName,
        });

        // Generate Object URL for preview
        const url = URL.createObjectURL(result.pdfBlob);
        setPreviewUrl(url);

        trackCustom({
          event: 'tool.use',
          tool: 'gif-to-pdf',
          inputSize: images.reduce((sum, img) => sum + img.file.size, 0),
          outputSize: result.fileSize || 0,
          processingTime: Date.now() - startTime,
          success: true,
          metadata: {
            imageCount: images.length,
            pageSize,
            fitMode,
            margins,
          },
        });
      } else {
        const errorMessage = result.error || 'PDF generation failed';
        setError(errorMessage);
        trackError(new Error(errorMessage), images.length);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        images.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    images,
    fileName,
    pageSize,
    customWidth,
    customHeight,
    fitMode,
    margins,
    previewUrl,
    trackCustom,
    trackError,
  ]);

  const handleDownload = useCallback(() => {
    if (pdfBlob && pdfMetadata) {
      downloadPdf(pdfBlob, pdfMetadata.fileName);
    }
  }, [pdfBlob, pdfMetadata]);

  const handleClear = useCallback(() => {
    // Cleanup preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImages([]);
    setPdfBlob(null);
    setPdfMetadata(null);
    setError(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {ui.uploadHeading || 'Upload GIF Images'}
          </h2>
          {images.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            >
              {ui.clearAll || 'Clear All'}
            </button>
          )}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500"
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.dropZoneMain || 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {ui.dropZoneSub || 'GIF files only (up to 10MB per file) - First frame will be used'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/gif,.gif"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ui.selectedImagesLabel || 'Selected GIF Images'} ({images.length})
            </h3>
            <div className="grid gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.file.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {img.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(img.file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-600"
                      title={ui.moveUp || 'Move up'}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-600"
                      title={ui.moveDown || 'Move down'}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title={ui.remove || 'Remove'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="mb-4 flex w-full items-center justify-between"
        >
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {ui.pdfSettingsHeading || 'PDF Settings'}
          </h2>
          <Settings
            className={`h-5 w-5 transition-transform ${showSettings ? 'rotate-90' : ''}`}
          />
        </button>

        {showSettings && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.pageSizeLabel || 'Page Size'}
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                {(Object.keys(PAGE_SIZES) as PageSize[]).map((size) => (
                  <option key={size} value={size}>
                    {size}
                    {size !== 'Custom' &&
                      ` (${PAGE_SIZES[size].width} x ${PAGE_SIZES[size].height}pt)`}
                  </option>
                ))}
              </select>
            </div>

            {pageSize === 'Custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ui.widthLabel || 'Width (pt)'}
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    min="50"
                    max="2000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ui.heightLabel || 'Height (pt)'}
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    min="50"
                    max="2000"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.imageFitLabel || 'Image Fit'}
              </label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as FitMode)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="contain">
                  {ui.fitContain || 'Contain (fit inside, maintain ratio)'}
                </option>
                <option value="cover">{ui.fitCover || 'Cover (fill page, may crop)'}</option>
                <option value="fill">{ui.fitFill || 'Fill (stretch to fill)'}</option>
                <option value="none">{ui.fitNone || 'None (original size)'}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.marginsLabel || 'Margins'}: {margins}pt
              </label>
              <input
                type="range"
                value={margins}
                onChange={(e) => setMargins(Number(e.target.value))}
                min="0"
                max="100"
                step="5"
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.filenameLabel || 'Filename'}
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder={ui.filenamePlaceholder || 'my-document.pdf'}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGeneratePdf}
          disabled={images.length === 0 || isProcessing}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
              {ui.generatingPdf || 'Generating PDF...'}
            </>
          ) : (
            <>
              <FileText className="mr-2 inline h-5 w-5" />
              {ui.generatePdf || 'Generate PDF'} ({images.length}{' '}
              {images.length === 1 ? (ui.imageSingular || 'image') : (ui.imagePlural || 'images')})
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {pdfBlob && pdfMetadata && (
        <div
          ref={resultRef}
          className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/20"
        >
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-medium text-green-900 dark:text-green-100">
              {ui.pdfGeneratedSuccess || 'PDF Generated Successfully!'}
            </h2>
          </div>

          <div className="mb-4 space-y-2 text-sm text-green-800 dark:text-green-200">
            <p>
              <strong>{ui.pagesLabel || 'Pages:'}</strong> {pdfMetadata.pageCount}
            </p>
            <p>
              <strong>{ui.fileSizeLabel || 'File Size:'}</strong> {formatFileSize(pdfMetadata.fileSize)}
            </p>
            <p>
              <strong>{ui.filenameResultLabel || 'Filename:'}</strong> {pdfMetadata.fileName}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
          >
            <Download className="h-5 w-5" />
            {ui.downloadPdf || 'Download PDF'}
          </button>

          {/* PDF Preview Section */}
          {previewUrl && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {ui.previewHeading || 'PDF Preview'}
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      {ui.hidePreview || 'Hide Preview'}
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      {ui.showPreview || 'Show Preview'}
                    </>
                  )}
                </button>
              </div>

              {showPreview && (
                <div className="overflow-hidden rounded-md border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                  <embed
                    src={previewUrl}
                    type="application/pdf"
                    className="h-[600px] w-full"
                    title={ui.previewHeading || 'PDF Preview'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
