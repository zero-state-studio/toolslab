/**
 * Excel Filter Tool
 * Load Excel files and apply dynamic filters to table data
 */

// xlsx (~134KB gz) is loaded on demand so the tool page doesn't pay for it
// until the user actually parses or exports a file.
type XLSXModule = typeof import('xlsx');

let xlsxPromise: Promise<XLSXModule> | null = null;

function loadXLSX(): Promise<XLSXModule> {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx');
  }
  return xlsxPromise;
}

export interface ExcelData {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  sheetName: string;
  totalRows: number;
  totalColumns: number;
}

export interface FilterOperator {
  label: string;
  value: string;
  types: ('text' | 'number' | 'date')[];
}

export interface ColumnFilter {
  column: string;
  operator: string;
  value: string | number | Date;
  value2?: string | number | Date; // For range filters
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export const FILTER_OPERATORS: FilterOperator[] = [
  { label: 'Contains', value: 'contains', types: ['text'] },
  { label: 'Does not contain', value: 'notContains', types: ['text'] },
  { label: 'Equals', value: 'equals', types: ['text', 'number', 'date'] },
  {
    label: 'Not equals',
    value: 'notEquals',
    types: ['text', 'number', 'date'],
  },
  { label: 'Starts with', value: 'startsWith', types: ['text'] },
  { label: 'Ends with', value: 'endsWith', types: ['text'] },
  { label: 'Greater than', value: 'gt', types: ['number', 'date'] },
  { label: 'Less than', value: 'lt', types: ['number', 'date'] },
  { label: 'Greater or equal', value: 'gte', types: ['number', 'date'] },
  { label: 'Less or equal', value: 'lte', types: ['number', 'date'] },
  { label: 'Between', value: 'between', types: ['number', 'date'] },
  { label: 'Is empty', value: 'isEmpty', types: ['text', 'number', 'date'] },
  {
    label: 'Is not empty',
    value: 'isNotEmpty',
    types: ['text', 'number', 'date'],
  },
];

/**
 * Detect column type based on values
 */
export function detectColumnType(
  values: any[]
): 'text' | 'number' | 'date' | 'mixed' {
  const nonEmptyValues = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  );

  if (nonEmptyValues.length === 0) return 'text';

  let numberCount = 0;
  let dateCount = 0;
  let textCount = 0;

  for (const value of nonEmptyValues.slice(0, 100)) {
    // Sample first 100 values
    if (typeof value === 'number' && !isNaN(value)) {
      numberCount++;
    } else if (value instanceof Date && !isNaN(value.getTime())) {
      dateCount++;
    } else if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!isNaN(parsed) && value.match(/\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/)) {
        dateCount++;
      } else if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
        numberCount++;
      } else {
        textCount++;
      }
    }
  }

  const total = numberCount + dateCount + textCount;
  const numberRatio = numberCount / total;
  const dateRatio = dateCount / total;

  if (numberRatio > 0.8) return 'number';
  if (dateRatio > 0.8) return 'date';
  if (textCount / total > 0.8) return 'text';

  return 'mixed';
}

/**
 * Parse Excel file from File object
 */
export async function parseExcelFile(file: File): Promise<ExcelData> {
  const XLSX = await loadXLSX();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        }) as Record<string, any>[];

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        const headers = Object.keys(jsonData[0]);

        resolve({
          headers,
          rows: jsonData,
          fileName: file.name,
          sheetName,
          totalRows: jsonData.length,
          totalColumns: headers.length,
        });
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error('Failed to parse Excel file')
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Apply filter to a single row
 */
function applyFilterToRow(
  row: Record<string, any>,
  filter: ColumnFilter
): boolean {
  const value = row[filter.column];

  // Handle empty checks
  if (filter.operator === 'isEmpty') {
    return value === null || value === undefined || value === '';
  }
  if (filter.operator === 'isNotEmpty') {
    return value !== null && value !== undefined && value !== '';
  }

  // If value is empty and operator is not isEmpty/isNotEmpty, return false
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const strValue = String(value).toLowerCase();
  const filterValue = String(filter.value).toLowerCase();

  switch (filter.operator) {
    case 'contains':
      return strValue.includes(filterValue);

    case 'notContains':
      return !strValue.includes(filterValue);

    case 'equals':
      return strValue === filterValue;

    case 'notEquals':
      return strValue !== filterValue;

    case 'startsWith':
      return strValue.startsWith(filterValue);

    case 'endsWith':
      return strValue.endsWith(filterValue);

    case 'gt':
      return Number(value) > Number(filter.value);

    case 'lt':
      return Number(value) < Number(filter.value);

    case 'gte':
      return Number(value) >= Number(filter.value);

    case 'lte':
      return Number(value) <= Number(filter.value);

    case 'between':
      if (filter.value2 === undefined) return false;
      const numValue = Number(value);
      return (
        numValue >= Number(filter.value) && numValue <= Number(filter.value2)
      );

    default:
      return true;
  }
}

/**
 * Apply filters to data
 */
export function applyFilters(
  data: ExcelData,
  filters: ColumnFilter[]
): Record<string, any>[] {
  if (filters.length === 0) {
    return data.rows;
  }

  return data.rows.filter((row) => {
    // All filters must pass (AND logic)
    return filters.every((filter) => applyFilterToRow(row, filter));
  });
}

/**
 * Apply global search
 */
export function applyGlobalSearch(
  rows: Record<string, any>[],
  searchTerm: string,
  headers: string[]
): Record<string, any>[] {
  if (!searchTerm.trim()) {
    return rows;
  }

  const term = searchTerm.toLowerCase();

  return rows.filter((row) => {
    return headers.some((header) => {
      const value = row[header];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

/**
 * Sort data
 */
export function sortData(
  rows: Record<string, any>[],
  sortConfig: SortConfig | null
): Record<string, any>[] {
  if (!sortConfig) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    const aVal = a[sortConfig.column];
    const bVal = b[sortConfig.column];

    // Handle null/undefined
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Try numeric comparison first
    const aNum = Number(aVal);
    const bNum = Number(bVal);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (sortConfig.direction === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

/**
 * Get unique values for a column
 */
export function getUniqueValues(
  rows: Record<string, any>[],
  column: string
): string[] {
  const values = new Set<string>();

  rows.forEach((row) => {
    const value = row[column];
    if (value !== null && value !== undefined && value !== '') {
      values.add(String(value));
    }
  });

  return Array.from(values).sort();
}

/**
 * Calculate column statistics
 */
export function getColumnStats(
  rows: Record<string, any>[],
  column: string
): {
  count: number;
  uniqueCount: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
} {
  const values = rows
    .map((row) => row[column])
    .filter((v) => v !== '' && v !== null && v !== undefined);
  const count = values.length;
  const uniqueCount = new Set(values).size;

  const numericValues = values
    .map((v) => Number(v))
    .filter((v) => !isNaN(v) && isFinite(v));

  if (numericValues.length > 0) {
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    return { count, uniqueCount, sum, avg, min, max };
  }

  return { count, uniqueCount };
}

/**
 * Export filtered data to CSV
 */
export function exportToCSV(
  rows: Record<string, any>[],
  headers: string[],
  fileName: string = 'filtered_data.csv'
): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue =
            value === null || value === undefined ? '' : String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export filtered data to Excel
 */
export async function exportToExcel(
  rows: Record<string, any>[],
  headers: string[],
  fileName: string = 'filtered_data.xlsx'
): Promise<void> {
  const XLSX = await loadXLSX();
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data');

  XLSX.writeFile(workbook, fileName);
}
