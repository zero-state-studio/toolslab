'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  FileIcon,
  UploadIcon,
  XIcon,
  DownloadIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  Loader2Icon,
} from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { BaseToolProps } from '@/lib/types/tools';
import { ServiceSuspendedCard } from '../ServiceSuspendedCard';
import AdBanner from '@/components/ads/AdBanner';

interface PdfToWordProps extends BaseToolProps {}

interface FileWithPreview {
  file: File;
  id: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  statusMessage?: string;
  error?: string;
  docxBlob?: Blob;
  metadata?: {
    pages?: number;
    pdfSize: number;
    docxSize?: number;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function PdfToWord({ dictionary }: PdfToWordProps) {
  const ui = dictionary?.tools?.['pdf-to-word']?.ui ?? {};
  const { addToHistory } = useToolStore();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Service is suspended - show card instead of tool
  const isServiceSuspended = true;

  const { resultRef, scrollToResult } = useScrollToResult({ delay: 300 });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setGlobalError(null);

    const validFiles = acceptedFiles.filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
    );
    const invalidCount = acceptedFiles.length - validFiles.length;

    if (invalidCount > 0) {
      setGlobalError(
        `${invalidCount} file(s) were rejected. Only PDF files are accepted.`
      );
    }

    if (validFiles.length > 10) {
      setGlobalError('Maximum 10 files can be uploaded at once.');
      validFiles.splice(10);
    }

    const newFiles: FileWithPreview[] = validFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      progress: 0,
      metadata: {
        pdfSize: file.size,
      },
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const convertFile = async (fileWithPreview: FileWithPreview) => {
    const startTime = Date.now(); // Track when processing starts

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileWithPreview.id
          ? {
              ...f,
              status: 'converting',
              progress: 10,
              statusMessage: 'Preparing file...',
            }
          : f
      )
    );

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Read file as base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(fileWithPreview.file);
      const pdfBase64 = await fileDataPromise;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithPreview.id
            ? { ...f, progress: 30, statusMessage: 'Converting PDF to Word...' }
            : f
        )
      );

      // Simulate progress during Railway processing
      progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileWithPreview.id && f.progress < 70) {
              return { ...f, progress: Math.min(f.progress + 5, 70) };
            }
            return f;
          })
        );
      }, 500);

      // Call external converter service (Railway)
      const converterUrl =
        process.env.NEXT_PUBLIC_PDF_CONVERTER_URL || 'http://localhost:8080';
      const response = await fetch(`${converterUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf: pdfBase64,
        }),
      });

      if (progressInterval) clearInterval(progressInterval);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithPreview.id
            ? { ...f, progress: 80, statusMessage: 'Processing result...' }
            : f
        )
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Conversion failed: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.docx) {
        throw new Error(result.error || 'No conversion result received');
      }

      // Convert base64 to blob
      const docxData = atob(result.docx);
      const docxBytes = new Uint8Array(docxData.length);
      for (let i = 0; i < docxData.length; i++) {
        docxBytes[i] = docxData.charCodeAt(i);
      }
      const docxBlob = new Blob([docxBytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithPreview.id
            ? {
                ...f,
                status: 'completed' as const,
                progress: 100,
                docxBlob,
                metadata: {
                  pdfSize: f.metadata?.pdfSize || f.file.size,
                  pages: f.metadata?.pages,
                  docxSize: result.metadata?.docxSize || docxBlob.size,
                },
              }
            : f
        )
      );

      // Track successful conversion
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-to-word',
        input: fileWithPreview.file.name,
        output: `Converted to DOCX (${formatFileSize(result.metadata?.docxSize || docxBlob.size)})`,
        timestamp: startTime, // When processing started, not finished
      });
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Conversion error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Conversion failed';

      // Track error in history (system will send tool.error event)
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-to-word',
        input: fileWithPreview.file.name,
        output: `Error: ${errorMessage}`,
        timestamp: startTime,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithPreview.id
            ? {
                ...f,
                status: 'error',
                statusMessage: undefined,
                error: errorMessage,
              }
            : f
        )
      );
    }
  };

  const convertAll = async () => {
    setIsConverting(true);
    setGlobalError(null);

    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const file of pendingFiles) {
      await convertFile(file);
    }

    setIsConverting(false);
  };

  // Auto-scroll when conversion completes
  useEffect(() => {
    const hasCompleted = files.some((f) => f.status === 'completed');
    if (hasCompleted) {
      scrollToResult();
    }
  }, [files, scrollToResult]);

  const downloadFile = (fileWithPreview: FileWithPreview) => {
    if (fileWithPreview.docxBlob) {
      const fileName = fileWithPreview.file.name.replace(
        /\.pdf$/i,
        '_converted.docx'
      );
      const url = URL.createObjectURL(fileWithPreview.docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadAll = () => {
    const completedFiles = files.filter(
      (f) => f.status === 'completed' && f.docxBlob
    );
    completedFiles.forEach((file) => {
      downloadFile(file);
    });
  };

  // If service is suspended, only show the suspended card
  // Use tool-specific messages if available, fallback to common messages
  if (isServiceSuspended) {
    const suspendedMessages =
      dictionary?.suspended || dictionary?.common?.suspended;
    return (
      <div className="space-y-4">
        <ServiceSuspendedCard messages={suspendedMessages} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="p-4">
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          {isDragActive ? (
            <p className="text-lg font-medium">{ui.dropActive || 'Drop PDF files here...'}</p>
          ) : (
            <>
              <p className="mb-2 text-lg font-medium">
                {ui.dropMainText || 'Drag & drop PDF files here, or click to select'}
              </p>
              <p className="text-sm text-gray-500">
                {ui.dropHint || 'Support for up to 10 files, max 50MB each'}
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Global Error */}
      {globalError && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Conversion Button */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="flex gap-2">
            <Button
              onClick={convertAll}
              disabled={
                isConverting || files.every((f) => f.status !== 'pending')
              }
              className="flex-1"
            >
              {isConverting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {ui.buttonConverting || 'Converting...'}
                </>
              ) : (
                <>
                  Convert {files.filter((f) => f.status === 'pending').length}{' '}
                  File(s)
                </>
              )}
            </Button>
            {files.some((f) => f.status === 'completed') && (
              <Button onClick={downloadAll} variant="outline">
                <DownloadIcon className="mr-2 h-4 w-4" />
                {ui.buttonDownloadAll || 'Download All'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Files List */}
      <div ref={resultRef}>
        {files.length > 0 && (
          <Card className="p-4">
            <h3 className="mb-4 text-lg font-semibold">
              Files ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  {/* File Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <FileIcon
                        className={`mt-1 h-5 w-5 flex-shrink-0 ${
                          fileItem.status === 'completed'
                            ? 'text-green-600'
                            : fileItem.status === 'error'
                              ? 'text-red-500'
                              : fileItem.status === 'converting'
                                ? 'text-blue-500'
                                : 'text-green-600'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                      </div>
                    </div>
                    {fileItem.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {fileItem.status === 'converting' && (
                    <div className="space-y-3 rounded-lg bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                          <div>
                            <p className="font-semibold text-primary">
                              {fileItem.statusMessage || 'Converting...'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ui.progressWait || 'Please wait, this may take a few seconds'}
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          {fileItem.progress}%
                        </span>
                      </div>
                      <Progress value={fileItem.progress} className="h-3" />
                    </div>
                  )}

                  {/* Success State */}
                  {fileItem.status === 'completed' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="font-medium">
                          {ui.conversionSuccessful || 'Conversion Successful'}
                        </span>
                      </div>

                      <Button
                        onClick={() => downloadFile(fileItem)}
                        className="w-full"
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        {ui.buttonDownloadWord || 'Download Word Document'}
                      </Button>
                    </div>
                  )}

                  {/* Error State */}
                  {fileItem.status === 'error' && (
                    <Alert variant="destructive">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        {fileItem.error || 'Conversion failed'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Ad: mobile — above tips */}
      <AdBanner
        className="lg:hidden"
        minHeight={100}
        maxHeight={280}
        slot="5833147302"
      />
      {/* Ad: desktop leaderboard — above tips so it sits right below the
          input on laptop viewports (replaces the page-level one) */}
      <AdBanner
        className="hidden text-center lg:block"
        fixedWidth={728}
        fixedHeight={90}
        minHeight={90}
        maxHeight={90}
        slot="3320031589"
      />

      {/* Tips */}
      {files.length === 0 && (
        <Card className="p-4">
          <h3 className="mb-4 text-lg font-semibold">
            💡 {ui.tipsHeading || 'Tips for Best Results'}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                {ui.tip1 || 'High-quality conversion powered by professional algorithms'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                {ui.tip2 || 'Layout, tables, and formatting are preserved automatically'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                {ui.tip3 || 'All conversion happens on our server - fast and secure'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                {ui.tip4 || 'Your files are never stored and are deleted immediately after conversion'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                {ui.tip5 || 'For password-protected PDFs, remove the password before converting'}
              </span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}
