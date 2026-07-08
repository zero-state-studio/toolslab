'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Upload,
  Search,
  Filter,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Info,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  parseExcelFile,
  applyFilters,
  applyGlobalSearch,
  sortData,
  exportToCSV,
  exportToExcel,
  detectColumnType,
  getUniqueValues,
  getColumnStats,
  FILTER_OPERATORS,
  ExcelData,
  ColumnFilter,
  SortConfig,
} from '@/lib/tools/excel-filter';
import { useToolStore } from '@/lib/store/toolStore';
import AdBanner from '@/components/ads/AdBanner';

interface ExcelFilterProps {
  categoryColor: string;
  locale?: string;
  dictionary?: any;
}

export default function ExcelFilter({
  categoryColor,
  locale,
  dictionary,
}: ExcelFilterProps) {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [filters, setFilters] = useState<ColumnFilter[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToHistory } = useToolStore();
  const ui = dictionary?.tools?.['excel-filter']?.ui ?? {};

  // Filtered and sorted data
  const processedData = useMemo(() => {
    if (!excelData) return [];

    let result = excelData.rows;

    // Apply filters
    if (filters.length > 0) {
      result = applyFilters(excelData, filters);
    }

    // Apply global search
    if (globalSearch.trim()) {
      result = applyGlobalSearch(result, globalSearch, excelData.headers);
    }

    // Apply sorting
    if (sortConfig) {
      result = sortData(result, sortConfig);
    }

    return result;
  }, [excelData, filters, globalSearch, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return processedData.slice(start, end);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  // Visible headers
  const visibleHeaders = useMemo(() => {
    if (!excelData) return [];
    return excelData.headers.filter((h) => !hiddenColumns.has(h));
  }, [excelData, hiddenColumns]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xlsx',
        '.xls',
      ];

      if (
        !validTypes.some(
          (type) =>
            file.type.includes(type) ||
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.name.toLowerCase().endsWith('.xls')
        )
      ) {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds 50MB limit');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await parseExcelFile(file);
        setExcelData(data);
        setFilters([]);
        setGlobalSearch('');
        setSortConfig(null);
        setHiddenColumns(new Set());
        setCurrentPage(1);

        // Track usage
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'excel-filter',
          input: `File: ${file.name} (${data.totalRows} rows, ${data.totalColumns} columns)`,
          output: `Loaded successfully`,
          timestamp: Date.now(),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to parse Excel file'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addToHistory]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // Add filter
  const addFilter = useCallback(() => {
    if (!excelData || excelData.headers.length === 0) return;

    setFilters((prev) => [
      ...prev,
      {
        column: excelData.headers[0],
        operator: 'contains',
        value: '',
      },
    ]);
  }, [excelData]);

  // Update filter
  const updateFilter = useCallback(
    (index: number, update: Partial<ColumnFilter>) => {
      setFilters((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...update } : f))
      );
      setCurrentPage(1);
    },
    []
  );

  // Remove filter
  const removeFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters([]);
    setGlobalSearch('');
    setSortConfig(null);
    setCurrentPage(1);
  }, []);

  // Toggle column visibility
  const toggleColumn = useCallback((column: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  }, []);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
    setCurrentPage(1);
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    if (!excelData) return;
    const fileName = excelData.fileName.replace(/\.[^/.]+$/, '_filtered.csv');
    exportToCSV(processedData, visibleHeaders, fileName);
  }, [excelData, processedData, visibleHeaders]);

  const handleExportExcel = useCallback(() => {
    if (!excelData) return;
    const fileName = excelData.fileName.replace(/\.[^/.]+$/, '_filtered.xlsx');
    void exportToExcel(processedData, visibleHeaders, fileName);
  }, [excelData, processedData, visibleHeaders]);

  // Reset all
  const handleReset = useCallback(() => {
    setExcelData(null);
    setFilters([]);
    setGlobalSearch('');
    setSortConfig(null);
    setHiddenColumns(new Set());
    setCurrentPage(1);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4">
      {/* Zell Banner */}
      <a
        href="https://zelldata.app"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between rounded-xl border border-cyan-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 p-4 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-md dark:border-cyan-800 dark:from-blue-950/50 dark:via-cyan-950/50 dark:to-teal-950/50 dark:hover:border-cyan-700"
      >
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/zelldata-logo.png"
            alt="Zell logo"
            className="h-14 w-14 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {ui.zellBannerHeading || 'Need more powerful Excel features?'}
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                New
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Try{' '}
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                Zell
              </span>{' '}
              — {ui.zellBannerDescription || 'Advanced spreadsheet analysis, pivot tables, charts & AI-powered insights'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all group-hover:from-blue-600 group-hover:to-cyan-600">
          <span>{ui.zellBannerButton || 'Try Zell'}</span>
          <ExternalLink className="h-4 w-4" />
        </div>
      </a>

      {/* Upload Section */}
      {!excelData && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {ui.uploadSectionHeading || 'Upload Excel File'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {ui.uploadSubtitle || 'Drag and drop your Excel file or click to browse (max 50MB)'}
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            }`}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {isDragging ? (
                <span className="font-medium text-blue-600">
                  {ui.dropFileHere || 'Drop file here'}
                </span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">
                    {ui.clickToUpload || 'Click to upload'}
                  </span>{' '}
                  {ui.orDragAndDrop || 'or drag and drop'}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {ui.fileTypeHint || 'XLSX or XLS up to 50MB'}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>{ui.loadingFile || 'Loading Excel file...'}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {excelData && (
        <>
          {/* Header Controls */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium text-gray-900 dark:text-white">
                  {excelData.fileName}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {processedData.length.toLocaleString()} {ui.rowsOf || 'of'}{' '}
                  {excelData.totalRows.toLocaleString()} {ui.rowsSuffix || 'rows'} •{' '}
                  {visibleHeaders.length} {ui.rowsOf || 'of'} {excelData.totalColumns} {ui.columnsSuffix || 'columns'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <Filter className="h-4 w-4" />
                  {ui.filtersButton || 'Filters'}
                  {filters.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {filters.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowColumnPanel(!showColumnPanel)}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <Eye className="h-4 w-4" />
                  {ui.columnsButton || 'Columns'}
                  {hiddenColumns.size > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                      {hiddenColumns.size} {ui.hiddenSuffix || 'hidden'}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <Download className="h-4 w-4" />
                  {ui.exportCsvButton || 'Export CSV'}
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  {ui.exportExcelButton || 'Export Excel'}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  {ui.newFileButton || 'New File'}
                </button>
              </div>
            </div>

            {/* Global Search */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={ui.globalSearchPlaceholder || 'Search across all columns...'}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {ui.columnFiltersHeading || 'Column Filters'}
                </h3>
                <div className="flex items-center gap-2">
                  {(filters.length > 0 || globalSearch || sortConfig) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      {ui.clearAll || 'Clear all'}
                    </button>
                  )}
                  <button
                    onClick={addFilter}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {ui.addFilter || '+ Add Filter'}
                  </button>
                </div>
              </div>

              {filters.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ui.noFiltersApplied || 'No filters applied. Click "Add Filter" to start filtering data.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filters.map((filter, index) => {
                    const detectedType = detectColumnType(
                      excelData.rows.map((r) => r[filter.column])
                    );
                    // Treat 'mixed' as 'text' for filter operators
                    const columnType =
                      detectedType === 'mixed' ? 'text' : detectedType;
                    const availableOperators = FILTER_OPERATORS.filter((op) =>
                      op.types.includes(columnType)
                    );

                    return (
                      <div
                        key={index}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50"
                      >
                        <select
                          value={filter.column}
                          onChange={(e) =>
                            updateFilter(index, { column: e.target.value })
                          }
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          {excelData.headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>

                        <select
                          value={filter.operator}
                          onChange={(e) =>
                            updateFilter(index, { operator: e.target.value })
                          }
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          {availableOperators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {!['isEmpty', 'isNotEmpty'].includes(
                          filter.operator
                        ) && (
                          <>
                            <input
                              type={columnType === 'number' ? 'number' : 'text'}
                              value={String(filter.value)}
                              onChange={(e) =>
                                updateFilter(index, {
                                  value:
                                    columnType === 'number'
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              placeholder={ui.filterValuePlaceholder || 'Value'}
                              className="min-w-[120px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />

                            {filter.operator === 'between' && (
                              <input
                                type={
                                  columnType === 'number' ? 'number' : 'text'
                                }
                                value={String(filter.value2 || '')}
                                onChange={(e) =>
                                  updateFilter(index, {
                                    value2:
                                      columnType === 'number'
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  })
                                }
                                placeholder={ui.filterValue2Placeholder || 'Value 2'}
                                className="min-w-[120px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                            )}
                          </>
                        )}

                        <button
                          onClick={() => removeFilter(index)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Column Panel */}
          {showColumnPanel && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
                {ui.manageColumnsHeading || 'Manage Columns'}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {excelData.headers.map((header) => (
                  <label
                    key={header}
                    className="flex items-center gap-2 rounded-md border border-gray-200 p-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(header)}
                      onChange={() => toggleColumn(header)}
                      className="rounded border-gray-300"
                    />
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {header}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                  <tr>
                    {visibleHeaders.map((header) => (
                      <th
                        key={header}
                        onClick={() => handleSort(header)}
                        className="cursor-pointer whitespace-nowrap px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <span>{header}</span>
                          {sortConfig?.column === header ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      {visibleHeaders.map((header) => (
                        <td
                          key={header}
                          className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100"
                        >
                          {String(row[header] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {processedData.length === 0 && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Info className="mx-auto mb-2 h-8 w-8" />
                  <p>{ui.noDataMatchesFilters || 'No data matches your filters'}</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {processedData.length > 0 && (
              <div className="flex flex-wrap items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{ui.rowsPerPage || 'Rows per page:'}</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {ui.pageLabel || 'Page'} {currentPage} {ui.pageOf || 'of'} {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {ui.previousButton || 'Previous'}
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {ui.nextButton || 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Ad: mobile only — above usage tips */}
      <AdBanner
        className="lg:hidden"
        minHeight={100}
        maxHeight={280}
        slot="5833147302"
      />

      {/* Usage Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4" />
          {dictionary?.tools?.['excel-filter']?.usageTips?.title ||
            'Usage Tips'}
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          {(
            dictionary?.tools?.['excel-filter']?.usageTips?.tips || [
              'Upload Excel files up to 50MB in size',
              'Combine multiple filters for advanced data querying',
              'Click column headers to sort data ascending/descending',
              'Use global search to find data across all columns instantly',
              'Export filtered results to CSV or Excel format',
            ]
          ).map((tip: string, index: number) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
