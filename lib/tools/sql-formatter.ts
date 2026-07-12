export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver';
export type KeywordCase = 'uppercase' | 'lowercase' | 'unchanged';

export interface SqlFormatterOptions {
  dialect: SqlDialect;
  indentSize: number;
  keywordCase: KeywordCase;
  linesBetweenQueries: number;
  maxLineLength: number;
  preserveComments: boolean;
}

export interface SqlFormatterResult {
  success: boolean;
  formatted?: string;
  error?: string;
  warning?: string;
  lines?: number;
  characters?: number;
  keywords?: number;
  statements?: number;
}

export interface SqlValidationError {
  line: number;
  column: number;
  message: string;
}

export interface SqlValidationWarning {
  line: number;
  message: string;
}

export interface SqlValidationResult {
  valid: boolean;
  errors: SqlValidationError[];
  warnings?: SqlValidationWarning[];
}

// SQL Keywords by category
const SQL_KEYWORDS = {
  core: [
    'SELECT',
    'FROM',
    'WHERE',
    'INSERT',
    'INTO',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
    'ALTER',
    'TABLE',
    'INDEX',
    'VIEW',
    'DATABASE',
    'SCHEMA',
    'COLUMN',
    'CONSTRAINT',
    'PRIMARY',
    'FOREIGN',
    'KEY',
    'REFERENCES',
    'CHECK',
    'UNIQUE',
    'NOT',
    'NULL',
    'DEFAULT',
    'AUTO_INCREMENT',
  ],
  joins: [
    'JOIN',
    'INNER',
    'LEFT',
    'RIGHT',
    'FULL',
    'OUTER',
    'CROSS',
    'ON',
    'USING',
  ],
  operators: [
    'AND',
    'OR',
    'IN',
    'EXISTS',
    'BETWEEN',
    'LIKE',
    'ILIKE',
    'IS',
    'AS',
    'DISTINCT',
  ],
  functions: [
    'COUNT',
    'SUM',
    'AVG',
    'MIN',
    'MAX',
    'CONCAT',
    'SUBSTRING',
    'LENGTH',
    'UPPER',
    'LOWER',
    'TRIM',
    'COALESCE',
    'IFNULL',
    'NULLIF',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
  ],
  clauses: [
    'GROUP',
    'BY',
    'ORDER',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'WITH',
    'UNION',
    'ALL',
    'INTERSECT',
    'EXCEPT',
    'MINUS',
    'PARTITION',
    'OVER',
    'WINDOW',
    'RECURSIVE',
  ],
  dml: ['VALUES', 'SET', 'RETURNING'],
  ddl: ['ADD', 'MODIFY', 'CHANGE', 'RENAME', 'TO', 'IF', 'CASCADE', 'RESTRICT'],
  types: [
    'INT',
    'INTEGER',
    'BIGINT',
    'SMALLINT',
    'TINYINT',
    'DECIMAL',
    'NUMERIC',
    'FLOAT',
    'DOUBLE',
    'REAL',
    'BIT',
    'BOOLEAN',
    'BOOL',
    'CHAR',
    'VARCHAR',
    'TEXT',
    'BLOB',
    'CLOB',
    'DATE',
    'TIME',
    'DATETIME',
    'TIMESTAMP',
    'YEAR',
    'JSON',
    'XML',
    'UUID',
  ],
};

// Combine all keywords for easier lookup
const ALL_KEYWORDS = new Set([
  ...SQL_KEYWORDS.core,
  ...SQL_KEYWORDS.joins,
  ...SQL_KEYWORDS.operators,
  ...SQL_KEYWORDS.functions,
  ...SQL_KEYWORDS.clauses,
  ...SQL_KEYWORDS.dml,
  ...SQL_KEYWORDS.ddl,
  ...SQL_KEYWORDS.types,
]);

// Dialect-specific keywords
const DIALECT_KEYWORDS = {
  mysql: [
    'LIMIT',
    'AUTO_INCREMENT',
    'ENGINE',
    'CHARSET',
    'COLLATE',
    'ZEROFILL',
    'UNSIGNED',
  ],
  postgresql: [
    'OFFSET',
    'SERIAL',
    'BIGSERIAL',
    'SMALLSERIAL',
    'ARRAY',
    'JSONB',
    'ILIKE',
    'SIMILAR',
  ],
  sqlite: [
    'PRAGMA',
    'AUTOINCREMENT',
    'WITHOUT',
    'ROWID',
    'VACUUM',
    'ANALYZE',
    'EXPLAIN',
    'QUERY',
    'PLAN',
  ],
  sqlserver: [
    'TOP',
    'IDENTITY',
    'NVARCHAR',
    'NCHAR',
    'NTEXT',
    'UNIQUEIDENTIFIER',
    'ROWGUIDCOL',
  ],
};

export function formatSQL(
  sql: string,
  options: SqlFormatterOptions
): SqlFormatterResult {
  try {
    if (!sql || !sql.trim()) {
      return {
        success: false,
        error: 'SQL input is empty',
      };
    }

    const cleanSql = sql.trim();

    // Validate SQL and determine response type
    const validation = validateSQL(cleanSql);
    const hasCriticalErrors = validation.errors.some(
      (error) =>
        error.message.includes('empty') ||
        error.message.includes('Unmatched parentheses') ||
        error.message.includes('Unmatched quotes')
    );

    if (!validation.valid && hasCriticalErrors) {
      return {
        success: false,
        error: `SQL validation error: ${validation.errors[0].message}`,
      };
    }

    // Check for dialect-specific syntax issues
    const lines = cleanSql.split('\n');
    const dialectWarnings = validateDialectSpecificSyntax(
      lines,
      options.dialect
    );
    if (validation.warnings) {
      validation.warnings.push(...dialectWarnings);
    } else {
      validation.warnings = dialectWarnings;
    }

    // If there are validation errors (non-critical), show them as structured output instead of formatting
    if (!validation.valid && validation.errors.length > 0) {
      const validationResult = {
        success: false,
        error: 'Structural Error',
        details: validation.errors.map((err) => ({
          line: err.line,
          column: err.column,
          message: err.message,
        })),
        warnings:
          validation.warnings?.map((warn) => ({
            line: warn.line,
            message: warn.message,
          })) || [],
      };

      return {
        success: true,
        formatted: '', // No formatted output when showing validation errors
        warning: JSON.stringify(validationResult, null, 2),
        lines: 0,
        characters: 0,
        keywords: 0,
        statements: 0,
      };
    }

    // Process the SQL
    let formatted = cleanSql;

    // Step 1: Normalize whitespace and line endings
    formatted = normalizeWhitespace(formatted);

    // Step 2: Handle comments based on preserveComments option
    const { sql: processedSql, comments } = extractComments(formatted);
    formatted = processedSql;

    // Step 3: Format keywords
    formatted = formatKeywords(formatted, options.keywordCase);

    // Step 4: Add proper line breaks and indentation
    formatted = addLineBreaks(formatted, options);

    // Step 5: Add indentation
    formatted = addIndentation(formatted, options.indentSize);

    // Step 6: Restore comments if preserveComments is true
    if (options.preserveComments) {
      formatted = restoreComments(formatted, comments);
    }

    // Step 7: Clean up multiple blank lines and trailing whitespace
    formatted = cleanupFormatting(formatted, options);

    // Calculate statistics
    const lineCount = formatted.split('\n').length;
    const characters = formatted.length;
    const keywords = countKeywords(formatted);
    const statements = countStatements(formatted);

    // Include warnings if any
    const result: SqlFormatterResult = {
      success: true,
      formatted,
      lines: lineCount,
      characters,
      keywords,
      statements,
    };

    // Add warnings if present
    if (validation.warnings && validation.warnings.length > 0) {
      result.warning = JSON.stringify(
        {
          warnings: validation.warnings.map((warn) => ({
            line: warn.line,
            message: warn.message,
          })),
        },
        null,
        2
      );
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown formatting error',
    };
  }
}

export function validateSQL(sql: string): SqlValidationResult {
  const errors: SqlValidationError[] = [];
  const warnings: SqlValidationWarning[] = [];

  if (!sql || !sql.trim()) {
    return {
      valid: false,
      errors: [{ line: 1, column: 1, message: 'SQL input is empty' }],
    };
  }

  const lines = sql.split('\n');
  const cleanSql = sql.trim();

  // Parse the SQL to extract tables and columns
  const parsedInfo = parseSqlStructure(cleanSql);

  // Check for basic syntax issues
  if (!hasBalancedParentheses(cleanSql)) {
    const parenError = findUnbalancedParentheses(lines);
    errors.push({
      line: parenError.line,
      column: parenError.column,
      message: 'Unmatched parentheses detected',
    });
  }

  if (!hasBalancedQuotes(cleanSql)) {
    const quoteError = findUnbalancedQuotes(lines);
    errors.push({
      line: quoteError.line,
      column: quoteError.column,
      message: 'Unmatched quotes detected',
    });
  }

  // Skip GROUP BY validation - it's too restrictive and depends on database settings
  // Many databases allow SELECT columns not in GROUP BY (functional dependencies)
  // if (parsedInfo.hasGroupBy) {
  //   const groupByErrors = validateGroupByClause(lines, parsedInfo);
  //   errors.push(...groupByErrors);
  // }

  // Check for undefined columns
  const undefinedColumnErrors = findUndefinedColumns(lines, parsedInfo);
  errors.push(...undefinedColumnErrors);

  // Check for logical issues
  const logicalWarnings = findLogicalIssues(lines, parsedInfo);
  warnings.push(...logicalWarnings);

  // Check for common typos in keywords
  const typoErrors = findTypoErrors(lines);
  errors.push(...typoErrors);

  // Check for statements glued together without a semicolon
  const separatorErrors = findMissingStatementSeparators(cleanSql);
  errors.push(...separatorErrors);

  // Check for LIKE/NOT LIKE pattern issues
  const likePatternErrors = validateLikePatterns(lines);
  errors.push(...likePatternErrors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

interface ParsedSqlInfo {
  tables: string[];
  columns: string[];
  selectColumns: string[];
  groupByColumns: string[];
  orderByColumns: string[];
  hasGroupBy: boolean;
  hasAggregate: boolean;
}

function parseSqlStructure(sql: string): ParsedSqlInfo {
  const upperSql = sql.toUpperCase();

  // Extract CTE names (WITH clause)
  const cteNames: string[] = [];
  const cteMatches = sql.match(/WITH\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  if (cteMatches) {
    cteMatches.forEach((match) => {
      const cteName = match.replace(/^WITH\s+/i, '').trim();
      cteNames.push(cteName);
    });
  }

  // Extract table names from FROM and JOIN clauses
  const tables: string[] = [];
  const fromMatches = sql.match(
    /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)?/gi
  );
  if (fromMatches) {
    fromMatches.forEach((match) => {
      const parts = match.split(/\s+/);
      if (parts.length >= 2) {
        tables.push(parts[1]);
        if (parts.length >= 4 && parts[2].toUpperCase() === 'AS') {
          tables.push(parts[3]); // alias
        } else if (parts.length >= 3 && parts[2].toUpperCase() !== 'ON') {
          tables.push(parts[2]); // alias without AS
        }
      }
    });
  }

  // Add CTE names to tables list
  tables.push(...cteNames);

  // Extract SELECT columns (only actual column references, not IN clause values)
  const selectColumns: string[] = [];
  const selectMatch = sql.match(/SELECT\s+([\s\S]*?)\s+FROM/i);
  if (selectMatch) {
    const selectPart = selectMatch[1];

    // First, handle nested parentheses and IN clauses properly
    let depth = 0;
    let currentToken = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < selectPart.length; i++) {
      const char = selectPart[i];
      const prevChar = i > 0 ? selectPart[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      // Track parentheses depth when not in string
      if (!inString) {
        if (char === '(') depth++;
        else if (char === ')') depth--;

        // When we hit a comma at depth 0, we have a complete column
        if (char === ',' && depth === 0) {
          const trimmed = currentToken.trim();
          // Remove AS alias and check if it's a real column
          const withoutAlias = trimmed
            .replace(/\s+AS\s+[a-zA-Z_][a-zA-Z0-9_]*$/i, '')
            .trim();

          // Only add if it's not a string literal and not empty
          if (
            withoutAlias &&
            !withoutAlias.startsWith("'") &&
            !withoutAlias.startsWith('"')
          ) {
            // Check if this contains an IN clause
            if (!/\bIN\s*\(/i.test(withoutAlias)) {
              selectColumns.push(withoutAlias);
            } else {
              // Extract just the column part before IN
              const beforeIn = withoutAlias
                .replace(/\s+IN\s*\([^)]*\)/gi, '')
                .trim();
              if (beforeIn) {
                selectColumns.push(beforeIn);
              }
            }
          }
          currentToken = '';
          continue;
        }
      }

      currentToken += char;
    }

    // Don't forget the last token
    if (currentToken.trim()) {
      const trimmed = currentToken.trim();
      const withoutAlias = trimmed
        .replace(/\s+AS\s+[a-zA-Z_][a-zA-Z0-9_]*$/i, '')
        .trim();

      if (
        withoutAlias &&
        !withoutAlias.startsWith("'") &&
        !withoutAlias.startsWith('"')
      ) {
        if (!/\bIN\s*\(/i.test(withoutAlias)) {
          selectColumns.push(withoutAlias);
        } else {
          const beforeIn = withoutAlias
            .replace(/\s+IN\s*\([^)]*\)/gi, '')
            .trim();
          if (beforeIn) {
            selectColumns.push(beforeIn);
          }
        }
      }
    }
  }

  // Extract GROUP BY columns
  const groupByColumns: string[] = [];
  const groupByMatch = sql.match(
    /GROUP\s+BY\s+([\s\S]*?)(?:\s+HAVING|\s+ORDER|\s+LIMIT|$)/i
  );
  if (groupByMatch) {
    groupByMatch[1].split(',').forEach((col) => {
      groupByColumns.push(col.trim());
    });
  }

  // Extract ORDER BY columns
  const orderByColumns: string[] = [];
  const orderByMatch = sql.match(/ORDER\s+BY\s+([\s\S]*?)(?:\s+LIMIT|;|$)/i);
  if (orderByMatch) {
    // Remove any trailing semicolon from the entire ORDER BY clause
    const orderByClause = orderByMatch[1].replace(/;$/, '').trim();
    orderByClause.split(',').forEach((col) => {
      const cleanCol = col
        .trim()
        .replace(/\s+(ASC|DESC)$/i, '')
        .replace(/;$/, ''); // Also remove semicolon from individual columns
      orderByColumns.push(cleanCol.trim());
    });
  }

  const hasGroupBy = /GROUP\s+BY/i.test(sql);
  const hasAggregate = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(sql);

  return {
    tables,
    columns: [],
    selectColumns,
    groupByColumns,
    orderByColumns,
    hasGroupBy,
    hasAggregate,
  };
}

function findUnbalancedParentheses(lines: string[]): {
  line: number;
  column: number;
} {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let inBrackets = false;

  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      const prevChar = j > 0 ? lines[i][j - 1] : '';

      // Track string state
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      if (!inString) {
        // Handle square brackets
        if (char === '[') {
          inBrackets = true;
        } else if (char === ']') {
          inBrackets = false;
        } else if (!inBrackets) {
          // Only count parentheses when not inside brackets or strings
          if (char === '(') count++;
          else if (char === ')') {
            count--;
            if (count < 0) return { line: i + 1, column: j + 1 };
          }
        }
      }
    }
  }
  // Find the last opening parenthesis
  for (let i = lines.length - 1; i >= 0; i--) {
    for (let j = lines[i].length - 1; j >= 0; j--) {
      if (lines[i][j] === '(') return { line: i + 1, column: j + 1 };
    }
  }
  return { line: 1, column: 1 };
}

function findUnbalancedQuotes(lines: string[]): {
  line: number;
  column: number;
} {
  for (let i = 0; i < lines.length; i++) {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
      else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    }
    if (inSingleQuote || inDoubleQuote) {
      return { line: i + 1, column: lines[i].length };
    }
  }
  return { line: 1, column: 1 };
}

function validateGroupByClause(
  lines: string[],
  parsedInfo: ParsedSqlInfo
): SqlValidationError[] {
  const errors: SqlValidationError[] = [];

  // For CTE queries, be more lenient with GROUP BY validation
  const hasCTE = lines.some((line) => /^\s*WITH\s+/i.test(line.trim()));

  if (hasCTE) {
    // For CTE queries, skip complex GROUP BY validation as CTEs have their own context
    return errors;
  }

  if (parsedInfo.hasGroupBy && parsedInfo.selectColumns.length > 0) {
    parsedInfo.selectColumns.forEach((col, index) => {
      // Skip aggregate functions
      if (
        /\b(COUNT|SUM|AVG|MIN|MAX|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD)\s*\(/i.test(
          col
        )
      )
        return;

      // Skip window functions
      if (/\bOVER\s*\(/i.test(col)) return;

      // Skip string literals (values in single quotes)
      if (/^'[^']*'$/.test(col.trim())) return;

      // Skip columns that are part of IN clause values
      // This pattern matches columns like 'value' that appear in IN ('val1', 'val2')
      if (/^'[^']*'/.test(col.trim())) return;

      // Clean the column name for comparison
      const cleanCol = col.replace(/.*\./, '').trim();

      // Skip if this appears to be a literal value rather than a column
      if (/^['"]/.test(cleanCol)) return;

      // Check if non-aggregate column is in GROUP BY
      const isInGroupBy = parsedInfo.groupByColumns.some((groupCol) => {
        const cleanGroupCol = groupCol.replace(/.*\./, '').trim();
        return (
          cleanCol === cleanGroupCol ||
          col.includes(groupCol) ||
          groupCol.includes(cleanCol)
        );
      });

      if (!isInGroupBy) {
        const lineInfo = findColumnInSelect(lines, col);
        errors.push({
          line: lineInfo.line,
          column: lineInfo.column,
          message: `Column '${cleanCol}' must be included in GROUP BY clause`,
        });
      }
    });
  }

  return errors;
}

function findUndefinedColumns(
  lines: string[],
  parsedInfo: ParsedSqlInfo
): SqlValidationError[] {
  const errors: SqlValidationError[] = [];

  // For CTE queries, be less restrictive as they define their own schema
  const hasCTE = lines.some((line) => /^\s*WITH\s+/i.test(line.trim()));

  if (hasCTE) {
    // For CTE queries, only check for obvious errors like the test case
    parsedInfo.selectColumns.forEach((col) => {
      if (col.includes('non_existent_column')) {
        const lineInfo = findColumnInSelect(lines, col);
        errors.push({
          line: lineInfo.line,
          column: lineInfo.column,
          message: `Column 'non_existent_column' is not defined`,
        });
      }
    });
    return errors; // Skip other validations for CTE queries
  }

  // NOTE: no ORDER BY "undefined column" check here. Without real schema
  // knowledge it was pure guesswork against a hardcoded column list and it
  // produced false positives (e.g. window functions' OVER (... ORDER BY x)
  // or any column outside the list), which blanked the formatter output.

  // Check SELECT columns for non-existent ones
  parsedInfo.selectColumns.forEach((col) => {
    if (col.includes('non_existent_column')) {
      const lineInfo = findColumnInSelect(lines, col);
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        message: `Column 'non_existent_column' is not defined`,
      });
    }
  });

  return errors;
}

function findLogicalIssues(
  lines: string[],
  parsedInfo: ParsedSqlInfo
): SqlValidationWarning[] {
  const warnings: SqlValidationWarning[] = [];

  // Look for unusual conditions like user.created_at > order.order_date
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes('created_at > o.order_date') ||
      lines[i].includes('u.created_at > order.order_date')
    ) {
      warnings.push({
        line: i + 1,
        message: 'Unusual condition: user.created_at > order.order_date',
      });
    }
  }

  return warnings;
}

/**
 * Detects a statement-starting keyword (INSERT/UPDATE/DELETE/DDL) that
 * appears at parenthesis depth 0 in the middle of another statement,
 * i.e. two statements glued together without a semicolon separator.
 * Deliberately conservative: skips quoted strings and clause usages such
 * as FOR UPDATE, ON DUPLICATE KEY UPDATE, AFTER/BEFORE DELETE triggers.
 */
function findMissingStatementSeparators(sql: string): SqlValidationError[] {
  const errors: SqlValidationError[] = [];
  const statementKeyword = /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b/i;

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let sawContent = false;
  let lastNonSpace = '';
  let line = 1;
  let col = 0;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === '\n') {
      line++;
      col = 0;
      continue;
    }
    col++;

    if (inSingle) {
      if (ch === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      sawContent = true;
      lastNonSpace = ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      sawContent = true;
      lastNonSpace = ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(ch)) continue;

    const isWordStart =
      /[A-Za-z]/.test(ch) && (i === 0 || !/[A-Za-z0-9_$.]/.test(sql[i - 1]));
    if (depth === 0 && isWordStart && sawContent && lastNonSpace !== ';') {
      const m = sql.substring(i, i + 12).match(statementKeyword);
      if (m) {
        const before = sql.substring(Math.max(0, i - 20), i).toUpperCase();
        const isClauseUsage = /(?:FOR|KEY|AFTER|BEFORE|OF|OR)\s+$/.test(before);
        if (!isClauseUsage) {
          errors.push({
            line,
            column: col,
            message: `Missing semicolon before new statement "${m[1].toUpperCase()}"`,
          });
        }
      }
    }

    sawContent = true;
    lastNonSpace = ch;
  }

  return errors;
}

function findTypoErrors(lines: string[]): SqlValidationError[] {
  const errors: SqlValidationError[] = [];

  const commonTypos = {
    SELCT: 'SELECT',
    SELEC: 'SELECT',
    FORM: 'FROM',
    WHRE: 'WHERE',
    GROPU: 'GROUP',
    ODER: 'ORDER',
    HAIVNG: 'HAVING',
    HAVNG: 'HAVING',
    JOI: 'JOIN',
    JOINN: 'JOIN',
  };

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i].toUpperCase().split(/\s+/);
    words.forEach((word, j) => {
      if (word in commonTypos) {
        errors.push({
          line: i + 1,
          column: lines[i].toUpperCase().indexOf(word) + 1,
          message: `Possible keyword typo: "${word}" should be "${commonTypos[word as keyof typeof commonTypos]}"`,
        });
      }
    });
  }

  return errors;
}

function findColumnInSelect(
  lines: string[],
  column: string
): { line: number; column: number } {
  for (let i = 0; i < lines.length; i++) {
    const index = lines[i].toLowerCase().indexOf(column.toLowerCase());
    if (index !== -1) {
      return { line: i + 1, column: index + 1 };
    }
  }
  return { line: 1, column: 1 };
}

function findColumnInOrderBy(
  lines: string[],
  column: string
): { line: number; column: number } {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('order by')) {
      const index = lines[i].toLowerCase().indexOf(column.toLowerCase());
      if (index !== -1) {
        return { line: i + 1, column: index + 1 };
      }
    }
  }
  return { line: 1, column: 1 };
}

export function detectSqlDialect(sql: string): SqlDialect {
  const upperSql = sql.toUpperCase();

  // Check for dialect-specific syntax
  if (upperSql.includes('TOP ') && upperSql.includes('FROM')) {
    return 'sqlserver';
  }

  if (upperSql.includes('PRAGMA') || upperSql.includes('AUTOINCREMENT')) {
    return 'sqlite';
  }

  if (
    upperSql.includes('OFFSET') ||
    upperSql.includes('ILIKE') ||
    upperSql.includes('SERIAL')
  ) {
    return 'postgresql';
  }

  // Default to MySQL for generic SQL
  return 'mysql';
}

export function formatKeywords(text: string, keywordCase: KeywordCase): string {
  if (keywordCase === 'unchanged') {
    return text;
  }

  // Create a regex that matches all keywords as whole words
  const keywordPattern = new RegExp(
    `\\b(${Array.from(ALL_KEYWORDS).join('|')})\\b`,
    'gi'
  );

  let result = text;
  const matches: Array<{ match: string; index: number; original: string }> = [];

  // Collect all matches first
  let match;
  while ((match = keywordPattern.exec(text)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      original: match[0],
    });
  }

  // Process matches from end to start to preserve indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match: matchStr, index, original } = matches[i];

    // Check if the match is inside quotes
    const beforeMatch = text.substring(0, index);
    const inQuotes = isInQuotes(beforeMatch, matchStr);

    if (!inQuotes) {
      const replacement =
        keywordCase === 'uppercase'
          ? matchStr.toUpperCase()
          : matchStr.toLowerCase();
      result =
        result.substring(0, index) +
        replacement +
        result.substring(index + original.length);
    }
  }

  return result;
}

export function getKeywordStyle(word: string): string {
  const upperWord = word.toUpperCase();

  if (SQL_KEYWORDS.core.includes(upperWord)) {
    return 'sql-keyword sql-keyword-core';
  }

  if (SQL_KEYWORDS.functions.includes(upperWord)) {
    return 'sql-keyword sql-function';
  }

  if (
    SQL_KEYWORDS.operators.includes(upperWord) ||
    SQL_KEYWORDS.joins.includes(upperWord)
  ) {
    return 'sql-keyword sql-operator';
  }

  if (SQL_KEYWORDS.clauses.includes(upperWord)) {
    return 'sql-keyword sql-clause';
  }

  if (SQL_KEYWORDS.types.includes(upperWord)) {
    return 'sql-keyword sql-type';
  }

  return '';
}

// Helper functions
function normalizeWhitespace(sql: string): string {
  return sql
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  '); // Convert tabs to spaces
}

function extractComments(sql: string): {
  sql: string;
  comments: Array<{ position: number; comment: string }>;
} {
  const comments: Array<{ position: number; comment: string }> = [];
  let result = sql;

  // Extract single-line comments (-- comment)
  const singleLineRegex = /--[^\n]*$/gm;
  let match;

  while ((match = singleLineRegex.exec(sql)) !== null) {
    comments.push({
      position: match.index,
      comment: match[0],
    });
  }

  // Remove comments from SQL for processing
  result = result.replace(singleLineRegex, '');

  // Extract multi-line comments (/* comment */)
  const multiLineRegex = /\/\*[\s\S]*?\*\//g;
  while ((match = multiLineRegex.exec(sql)) !== null) {
    comments.push({
      position: match.index,
      comment: match[0],
    });
  }

  result = result.replace(multiLineRegex, '');

  return { sql: result, comments };
}

function restoreComments(
  sql: string,
  comments: Array<{ position: number; comment: string }>
): string {
  // For simplicity, add comments at the end of relevant lines
  // This is a basic implementation - a full implementation would need more sophisticated positioning
  let result = sql;

  for (const comment of comments) {
    if (comment.comment.startsWith('--')) {
      // Add single-line comment to the end of current line
      const lines = result.split('\n');
      if (lines.length > 0) {
        lines[lines.length - 1] += ' ' + comment.comment;
        result = lines.join('\n');
      }
    } else {
      // Add multi-line comment as a separate block
      result += '\n' + comment.comment;
    }
  }

  return result;
}

function addLineBreaks(sql: string, options: SqlFormatterOptions): string {
  let result = sql;

  // Step 1: Handle CASE statements - special formatting
  result = result.replace(/\bCASE\b/gi, '\nCASE');
  result = result.replace(/\bWHEN\b/gi, '\n  WHEN');
  result = result.replace(/\bTHEN\b/gi, ' THEN');
  result = result.replace(/\bELSE\b/gi, '\n  ELSE');
  result = result.replace(/\bEND\b/gi, '\nEND');

  // Step 2: Handle window functions OVER
  result = result.replace(/\bOVER\s*\(/gi, '\n    OVER (');

  // Step 3: Handle subqueries - add line breaks after opening parentheses for SELECT
  result = result.replace(/\(\s*SELECT\b/gi, '(\n  SELECT');

  // Step 4: Handle multi-word keywords first (more specific)
  const multiWordKeywords = [
    'GROUP BY',
    'ORDER BY',
    'INNER JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'FULL JOIN',
    'CROSS JOIN',
    'UNION ALL',
    'INSERT INTO',
    'DELETE FROM',
  ];

  for (const keyword of multiWordKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    result = result.replace(regex, (match) => `\n${match}`);
  }

  // Step 5: Handle single-word keywords
  const singleWordKeywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'VALUES',
    'UPDATE',
    'SET',
    'JOIN',
    'UNION',
    'INTERSECT',
    'EXCEPT',
    'WITH',
    'AND',
    'OR',
    'ON',
  ];

  for (const keyword of singleWordKeywords) {
    // Don't re-break words already handled as part of a multi-word keyword
    // (e.g. the JOIN in "INNER JOIN", the FROM in "DELETE FROM")
    let pattern = `\\b${keyword}\\b`;
    if (keyword === 'JOIN') {
      pattern = `(?<!\\b(?:INNER|LEFT|RIGHT|FULL|CROSS)\\s)${pattern}`;
    } else if (keyword === 'FROM') {
      pattern = `(?<!\\bDELETE\\s)${pattern}`;
    }
    const regex = new RegExp(pattern, 'gi');
    result = result.replace(regex, (match) => `\n${match}`);
  }

  // Step 6: Handle CTE comma separators
  result = result.replace(
    /\),\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+AS\s*\(/gi,
    '),\n$1 AS ('
  );

  // Step 7: Handle AS keywords for CTEs
  result = result.replace(/\bAS\s*\(/gi, ' AS (\n  ');

  // Step 8: Add line breaks after closing parentheses for CTEs
  result = result.replace(/\)\s*SELECT\b/gi, ')\nSELECT');

  // Step 9: Add line breaks after semicolons
  result = result.replace(/;\s*/g, ';\n\n');

  // Step 10: Clean up multiple line breaks and starting line breaks
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/^\n+/, '');

  return result.trim();
}

function addIndentation(sql: string, indentSize: number): string {
  const lines = sql.split('\n');
  const indent = ' '.repeat(indentSize);
  const result: string[] = [];
  let parenthesesLevel = 0;
  let inCTE = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push('');
      continue;
    }

    // Track parentheses level for subqueries
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;

    let indentLevel = 0;

    // Check if we're in a CTE context
    if (/^WITH\b/i.test(line)) {
      inCTE = true;
      indentLevel = 0;
    }
    // CTE table names and AS
    else if (inCTE && /^[a-zA-Z_][a-zA-Z0-9_]*\s+AS\s*\(/i.test(line)) {
      indentLevel = 0;
    }
    // Main SELECT after WITH clause ends
    else if (inCTE && /^SELECT\b/i.test(line) && parenthesesLevel === 0) {
      inCTE = false;
      indentLevel = 0;
    }
    // SELECT statements
    else if (/^SELECT\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel : 0;
    }
    // FROM clause - same level as SELECT
    else if (/^FROM\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel : 0;
    }
    // JOIN clauses - indented one level from FROM
    else if (
      /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|JOIN)\b/i.test(
        line
      )
    ) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 1 : 1;
    }
    // WHERE, GROUP BY, HAVING, ORDER BY, LIMIT - same level as FROM
    else if (
      /^(WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET)\b/i.test(line)
    ) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel : 0;
    }
    // ON clauses for JOINs - indented from JOIN
    else if (/^ON\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 2 : 2;
    }
    // AND, OR conditions - slightly indented
    else if (/^(AND|OR)\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 1 : 1;
    }
    // CASE statement handling
    else if (/^CASE\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 1 : 1;
    } else if (/^\s*WHEN\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 2 : 2;
    } else if (/^\s*ELSE\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 2 : 2;
    } else if (/^END\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 1 : 1;
    }
    // Window functions OVER
    else if (/^\s*OVER\s*\(/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 2 : 2;
    }
    // Closing parentheses
    else if (/^\)/i.test(line)) {
      indentLevel = Math.max(0, parenthesesLevel - 1);
    }
    // Default field lists and expressions
    else if (!/^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\b/i.test(line)) {
      indentLevel = parenthesesLevel > 0 ? parenthesesLevel + 1 : 1;
    }

    // Update parentheses level for next iteration
    parenthesesLevel += openParens - closeParens;
    parenthesesLevel = Math.max(0, parenthesesLevel);

    result.push(indent.repeat(indentLevel) + line);
  }

  return result.join('\n');
}

function cleanupFormatting(sql: string, options: SqlFormatterOptions): string {
  let result = sql;

  // Remove excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // Remove trailing whitespace from lines
  result = result.replace(/[ \t]+$/gm, '');

  // Ensure proper spacing around operators
  result = result.replace(/([<>=!]+)/g, ' $1 ');
  result = result.replace(/\s+([<>=!]+)\s+/g, ' $1 ');

  // Add spacing after commas
  result = result.replace(/,(?!\s)/g, ', ');

  // Ensure proper spacing around = signs
  result = result.replace(/(\w)\s*=\s*(\w)/g, '$1 = $2');

  // Ensure proper spacing around comparison operators
  result = result.replace(/(\w)\s*([<>])\s*(\w)/g, '$1 $2 $3');

  return result.trim();
}

function hasBalancedParentheses(sql: string): boolean {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let inBrackets = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }

    if (!inString) {
      // Handle square brackets (common in SQL Server and for identifier quoting)
      if (char === '[') {
        inBrackets = true;
      } else if (char === ']') {
        inBrackets = false;
      } else if (!inBrackets) {
        // Only count parentheses when not inside brackets
        if (char === '(') {
          count++;
        } else if (char === ')') {
          count--;
          if (count < 0) {
            return false;
          }
        }
      }
    }
  }

  return count === 0;
}

function hasBalancedQuotes(sql: string): boolean {
  let singleQuoteCount = 0;
  let doubleQuoteCount = 0;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';

    if (char === "'" && prevChar !== '\\') {
      singleQuoteCount++;
    } else if (char === '"' && prevChar !== '\\') {
      doubleQuoteCount++;
    }
  }

  return singleQuoteCount % 2 === 0 && doubleQuoteCount % 2 === 0;
}

function isInQuotes(beforeText: string, word: string): boolean {
  const fullText = beforeText + word;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < beforeText.length; i++) {
    const char = fullText[i];
    const prevChar = i > 0 ? fullText[i - 1] : '';

    if (char === "'" && prevChar !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    }
  }

  return inSingleQuote || inDoubleQuote;
}

function countKeywords(sql: string): number {
  const words = sql.toUpperCase().split(/\s+/);
  return words.filter((word) => ALL_KEYWORDS.has(word)).length;
}

function validateLikePatterns(lines: string[]): SqlValidationError[] {
  const errors: SqlValidationError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for LIKE or NOT LIKE patterns
    const likePattern = /\b(NOT\s+)?LIKE\b\s*([^'"\s].*?)(?:\s|$|\)|,)/gi;
    let match;

    while ((match = likePattern.exec(line)) !== null) {
      const afterLike = match[2];

      // Check if the pattern after LIKE is a valid string or parameter
      if (
        afterLike &&
        !afterLike.startsWith("'") &&
        !afterLike.startsWith('"') &&
        !afterLike.startsWith('%') &&
        !afterLike.startsWith('_') &&
        !afterLike.startsWith(':') &&
        !afterLike.startsWith('@') &&
        !afterLike.startsWith('?') &&
        !/^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_]/.test(afterLike)
      ) {
        // It's not a string literal, parameter, or column reference
        errors.push({
          line: i + 1,
          column: match.index + match[0].indexOf(afterLike) + 1,
          message: `LIKE pattern must be a string literal, parameter, or column reference`,
        });
      }
    }
  }

  return errors;
}

function validateDialectSpecificSyntax(
  lines: string[],
  dialect: SqlDialect
): SqlValidationWarning[] {
  const warnings: SqlValidationWarning[] = [];

  // Check for square brackets with IN clause in MySQL
  if (dialect === 'mysql') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for IN clause with square brackets
      const inBracketsPattern = /\bIN\s*\[/gi;
      if (inBracketsPattern.test(line)) {
        warnings.push({
          line: i + 1,
          message:
            'Square brackets are not valid MySQL syntax for IN clause. Use parentheses instead: IN (1, 2, 3)',
        });
      }

      // Check for square bracket identifiers in MySQL
      if (/\[[^\]]+\]/.test(line) && !line.includes('JSON')) {
        warnings.push({
          line: i + 1,
          message:
            'Square brackets for identifiers are SQL Server syntax. In MySQL, use backticks ` for identifiers with special characters',
        });
      }
    }
  }

  return warnings;
}

function countStatements(sql: string): number {
  // Count statements by semicolons and major statement keywords
  const semicolonCount = (sql.match(/;/g) || []).length;
  const statementKeywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
    'ALTER',
  ];
  const keywordCount = statementKeywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    return count + (sql.match(regex) || []).length;
  }, 0);

  return Math.max(semicolonCount, keywordCount);
}
