/**
 * HTML to Markdown Converter
 * Converts HTML to Markdown using TurndownService with GFM plugin
 * and Markdown to HTML using marked + DOMPurify
 */

import TurndownService from 'turndown';
import { gfm, tables, strikethrough, taskListItems } from 'turndown-plugin-gfm';
import { marked } from 'marked';

export type ConversionMode = 'html-to-md' | 'md-to-html';

export interface HtmlToMarkdownOptions {
  headingStyle?: 'atx' | 'setext';
  bulletListMarker?: '-' | '*' | '+';
  codeBlockStyle?: 'fenced' | 'indented';
  hr?: string;
}

export interface ConversionResult {
  success: boolean;
  result?: string;
  error?: string;
  stats?: {
    inputChars: number;
    outputChars: number;
    inputLines: number;
    outputLines: number;
  };
}

/**
 * Convert HTML to Markdown using TurndownService with GFM plugin
 */
export function htmlToMarkdown(
  html: string,
  options: HtmlToMarkdownOptions = {}
): ConversionResult {
  try {
    if (!html || !html.trim()) {
      return {
        success: true,
        result: '',
        stats: { inputChars: 0, outputChars: 0, inputLines: 0, outputLines: 0 },
      };
    }

    const {
      headingStyle = 'atx',
      bulletListMarker = '-',
      codeBlockStyle = 'fenced',
      hr = '---',
    } = options;

    const turndownService = new TurndownService({
      headingStyle,
      bulletListMarker,
      codeBlockStyle,
      hr,
    });

    // Apply GFM plugin (tables, strikethrough, task lists)
    turndownService.use(gfm);

    const result = turndownService.turndown(html);

    return {
      success: true,
      result,
      stats: {
        inputChars: html.length,
        outputChars: result.length,
        inputLines: html.split('\n').length,
        outputLines: result.split('\n').length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Convert Markdown to HTML using marked
 * Output is sanitized to prevent XSS
 */
export function markdownToHtml(markdown: string): ConversionResult {
  try {
    if (!markdown || !markdown.trim()) {
      return {
        success: true,
        result: '',
        stats: { inputChars: 0, outputChars: 0, inputLines: 0, outputLines: 0 },
      };
    }

    // Configure marked with GFM options
    marked.setOptions({
      gfm: true,
      breaks: false,
    });

    const rawHtml = marked.parse(markdown) as string;

    // Sanitize on client side (DOMPurify is browser-only)
    let sanitized = rawHtml;
    if (typeof window !== 'undefined') {
      const { default: DOMPurify } = require('dompurify');
      sanitized = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ADD_ATTR: ['class'],
      });
    }

    return {
      success: true,
      result: sanitized,
      stats: {
        inputChars: markdown.length,
        outputChars: sanitized.length,
        inputLines: markdown.split('\n').length,
        outputLines: sanitized.split('\n').length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}
