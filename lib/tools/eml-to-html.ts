/**
 * EML to HTML Converter Tool
 * Parses EML (RFC822/2822) email files and converts them to HTML
 * Supports MIME parsing, multipart messages, attachments, and various encodings
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content using DOMPurify for robust XSS protection
 * Note: DOMPurify requires a DOM environment. On server-side (SSR),
 * we use a fallback approach or the client-side sanitization is applied.
 */
function sanitizeHtmlContent(html: string, removeScripts: boolean): string {
  if (!removeScripts) return html;

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: Use DOMPurify with strict configuration
    return DOMPurify.sanitize(html, {
      // Safe tags for email content
      ALLOWED_TAGS: [
        // Structure
        'html',
        'head',
        'body',
        'div',
        'span',
        'p',
        'br',
        'hr',
        // Text formatting
        'a',
        'b',
        'i',
        'u',
        'em',
        'strong',
        'small',
        'sub',
        'sup',
        'mark',
        'del',
        'ins',
        's',
        'strike',
        'font',
        // Headers
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        // Lists
        'ul',
        'ol',
        'li',
        'dl',
        'dt',
        'dd',
        // Tables
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'caption',
        'colgroup',
        'col',
        // Media (no script execution)
        'img',
        'picture',
        'source',
        'figure',
        'figcaption',
        // Semantic
        'article',
        'section',
        'header',
        'footer',
        'nav',
        'aside',
        'main',
        // Other
        'blockquote',
        'pre',
        'code',
        'address',
        'center',
        'q',
        'cite',
        // Style (CSS only, no JS)
        'style',
      ],
      ALLOWED_ATTR: [
        // Common attributes
        'id',
        'class',
        'style',
        'title',
        'lang',
        'dir',
        // Links
        'href',
        'target',
        'rel',
        // Images
        'src',
        'alt',
        'width',
        'height',
        'loading',
        // Tables
        'colspan',
        'rowspan',
        'cellpadding',
        'cellspacing',
        'border',
        'align',
        'valign',
        // Font (legacy email support)
        'color',
        'size',
        'face',
        // Other
        'name',
        'data-*',
      ],
      // Explicitly forbid dangerous elements
      FORBID_TAGS: [
        'script',
        'iframe',
        'object',
        'embed',
        'form',
        'input',
        'button',
        'textarea',
        'select',
      ],
      // Forbid dangerous attributes
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
      ],
      // Allow data: URIs for inline images (common in emails)
      ALLOW_DATA_ATTR: true,
      // Allow safe URI schemes
      ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto|tel|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  } else {
    // Server-side fallback: Use stricter regex-based sanitization
    // This is only used during SSR; client-side will re-sanitize
    let sanitized = html;

    // Remove script tags (including variants)
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );
    sanitized = sanitized.replace(/<script[^>]*>/gi, '');

    // Remove iframe, object, embed, form elements
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      ''
    );
    sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
    sanitized = sanitized.replace(
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
      ''
    );

    // Remove all event handlers (on* attributes)
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

    // Remove javascript: and vbscript: protocols
    sanitized = sanitized.replace(/javascript\s*:/gi, 'blocked:');
    sanitized = sanitized.replace(/vbscript\s*:/gi, 'blocked:');

    // Remove expression() in CSS (IE vulnerability)
    sanitized = sanitized.replace(/expression\s*\(/gi, 'blocked(');

    return sanitized;
  }
}

export interface EmailHeader {
  name: string;
  value: string;
  raw?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  encoding: string;
  content: string;
  contentId?: string;
  disposition?: string;
}

export interface EmailPart {
  contentType: string;
  charset?: string;
  encoding?: string;
  content: string;
  headers: EmailHeader[];
  boundary?: string;
  parts?: EmailPart[];
}

export interface ParsedEmail {
  headers: EmailHeader[];
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  date?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];

  // Body content
  textBody?: string;
  htmlBody?: string;

  // Attachments
  attachments: EmailAttachment[];
  inlineImages: EmailAttachment[];

  // MIME structure
  contentType?: string;
  boundary?: string;
  parts: EmailPart[];

  // Metadata
  rawHeaders: string;
  hasAuthentication: boolean;
  hasTracking: boolean;
  clientDetection?: string;
  templateType?: string;
}

export interface ConversionOptions {
  sanitizeHtml?: boolean;
  removeScripts?: boolean;
  convertCidToDataUri?: boolean;
  inlineCss?: boolean;
  darkModeConversion?: boolean;
  includeHeaders?: boolean;
  maxAttachmentSize?: number; // in bytes
}

export interface ExtractedLink {
  url: string;
  text: string;
  isTracking: boolean;
}

export interface ConversionResult {
  success: boolean;
  html?: string;
  headersHtml?: string;
  rawView?: string;
  sourceView?: string;
  parsedEmail?: ParsedEmail;
  error?: string;
  warnings?: string[];
  links?: ExtractedLink[];
}

/**
 * Decodes MIME encoded words (=?charset?encoding?text?=)
 */
function decodeMimeWord(text: string): string {
  if (!text) return '';

  const mimeWordRegex = /=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g;

  return text.replace(mimeWordRegex, (match, charset, encoding, encoded) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        // Base64 encoding
        const decoded = atob(encoded);
        return decodeURIComponent(escape(decoded));
      } else if (encoding.toUpperCase() === 'Q') {
        // Quoted-printable encoding
        const decoded = encoded
          .replace(/_/g, ' ')
          .replace(/=([0-9A-F]{2})/gi, (_: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
          );
        return decoded;
      }
    } catch (e) {
      return match;
    }
    return match;
  });
}

/**
 * Decodes quoted-printable encoding
 */
function decodeQuotedPrintable(text: string): string {
  if (!text) return '';

  try {
    // First, handle soft line breaks
    const withoutSoftBreaks = text.replace(/=\r?\n/g, '');

    // Replace =XX hex sequences
    const decoded = withoutSoftBreaks.replace(
      /=([0-9A-F]{2})/gi,
      (_: string, hex: string) => {
        return String.fromCharCode(parseInt(hex, 16));
      }
    );

    // Try to decode as UTF-8
    try {
      return decodeURIComponent(escape(decoded));
    } catch {
      // If UTF-8 decoding fails, return as-is
      return decoded;
    }
  } catch (e) {
    _decodeWarnings.push('Quoted-printable decoding failed — original text preserved');
    return text;
  }
}

// Track decode warnings globally per conversion
let _decodeWarnings: string[] = [];

/**
 * Decodes base64 content
 */
function decodeBase64(text: string): string {
  if (!text) return '';

  try {
    const cleaned = text.replace(/\s/g, '');
    const decoded = atob(cleaned);
    return decodeURIComponent(escape(decoded));
  } catch (e) {
    _decodeWarnings.push('Base64 decoding failed for a content section — original text preserved');
    return text;
  }
}

/**
 * Decodes content based on transfer encoding
 */
function decodeContent(content: string, encoding?: string): string {
  if (!content) return '';

  const enc = (encoding || '').toLowerCase();

  switch (enc) {
    case 'base64':
      return decodeBase64(content);
    case 'quoted-printable':
      return decodeQuotedPrintable(content);
    case '7bit':
    case '8bit':
    case 'binary':
    default:
      return content;
  }
}

/**
 * Parses email headers
 */
function parseHeaders(headerText: string): EmailHeader[] {
  const headers: EmailHeader[] = [];
  const lines = headerText.split(/\r?\n/);

  let currentHeader: EmailHeader | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Check if this is a continuation of previous header (starts with whitespace)
    if (/^\s/.test(line) && currentHeader) {
      currentHeader.value += ' ' + line.trim();
      currentHeader.raw += '\n' + line;
    } else {
      // New header
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        if (currentHeader) {
          headers.push(currentHeader);
        }

        const name = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        currentHeader = {
          name,
          value: decodeMimeWord(value),
          raw: line,
        };
      }
    }
  }

  if (currentHeader) {
    headers.push(currentHeader);
  }

  return headers;
}

/**
 * Extracts header value by name
 */
function getHeader(headers: EmailHeader[], name: string): string | undefined {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value;
}

/**
 * Extracts all header values by name (for headers that can appear multiple times)
 */
function getHeaders(headers: EmailHeader[], name: string): string[] {
  return headers
    .filter((h) => h.name.toLowerCase() === name.toLowerCase())
    .map((h) => h.value);
}

/**
 * Parses content type header
 */
function parseContentType(contentType?: string): {
  type: string;
  charset?: string;
  boundary?: string;
  name?: string;
} {
  if (!contentType) {
    return { type: 'text/plain', charset: 'utf-8' };
  }

  const parts = contentType.split(';').map((p) => p.trim());
  const type = parts[0];

  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const [key, ...valueParts] = parts[i].split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      params[key.trim().toLowerCase()] = value;
    }
  }

  return {
    type,
    charset: params.charset,
    boundary: params.boundary,
    name: params.name,
  };
}

/**
 * Parses multipart email body
 */
function parseMultipart(
  content: string,
  boundary: string,
  headers: EmailHeader[]
): EmailPart[] {
  const parts: EmailPart[] = [];

  // Split by boundary
  const boundaryRegex = new RegExp(
    `--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g'
  );
  const sections = content.split(boundaryRegex);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed === '--') continue;

    // Split headers and content
    const doubleNewline = trimmed.search(/\r?\n\r?\n/);
    if (doubleNewline === -1) continue;

    const partHeaderText = trimmed.substring(0, doubleNewline);
    const partContent = trimmed.substring(doubleNewline).trim();

    const partHeaders = parseHeaders(partHeaderText);
    const contentTypeHeader = getHeader(partHeaders, 'Content-Type');
    const contentType = parseContentType(contentTypeHeader);
    const encoding = getHeader(partHeaders, 'Content-Transfer-Encoding');

    const part: EmailPart = {
      contentType: contentType.type,
      charset: contentType.charset,
      encoding,
      content: partContent,
      headers: partHeaders,
      boundary: contentType.boundary,
    };

    // If this part is also multipart, recursively parse
    if (contentType.type.startsWith('multipart/') && contentType.boundary) {
      part.parts = parseMultipart(
        partContent,
        contentType.boundary,
        partHeaders
      );
    }

    parts.push(part);
  }

  return parts;
}

/**
 * Extracts text and HTML bodies from parts
 */
function extractBodies(parts: EmailPart[]): {
  textBody?: string;
  htmlBody?: string;
} {
  let textBody: string | undefined;
  let htmlBody: string | undefined;

  for (const part of parts) {
    // Recursively check nested parts
    if (part.parts && part.parts.length > 0) {
      const nested = extractBodies(part.parts);
      if (!textBody && nested.textBody) textBody = nested.textBody;
      if (!htmlBody && nested.htmlBody) htmlBody = nested.htmlBody;
    }

    // Extract based on content type
    if (part.contentType.startsWith('text/plain')) {
      if (!textBody) {
        textBody = decodeContent(part.content, part.encoding);
      }
    } else if (part.contentType.startsWith('text/html')) {
      if (!htmlBody) {
        htmlBody = decodeContent(part.content, part.encoding);
      }
    }
  }

  return { textBody, htmlBody };
}

/**
 * Extracts attachments from parts
 */
function extractAttachments(parts: EmailPart[]): {
  attachments: EmailAttachment[];
  inlineImages: EmailAttachment[];
} {
  const attachments: EmailAttachment[] = [];
  const inlineImages: EmailAttachment[] = [];

  for (const part of parts) {
    // Recursively check nested parts
    if (part.parts && part.parts.length > 0) {
      const nested = extractAttachments(part.parts);
      attachments.push(...nested.attachments);
      inlineImages.push(...nested.inlineImages);
    }

    const disposition = getHeader(part.headers, 'Content-Disposition');
    const contentId = getHeader(part.headers, 'Content-ID');

    // Skip text parts that are the main body
    if (
      part.contentType.startsWith('text/plain') ||
      part.contentType.startsWith('text/html')
    ) {
      // Only skip if no Content-Disposition header (main body)
      if (!disposition) continue;
    }

    // Extract filename
    let filename = 'untitled';
    if (disposition) {
      const filenameMatch = disposition.match(
        /filename\s*=\s*["']?([^"';]+)["']?/i
      );
      if (filenameMatch) filename = filenameMatch[1];
    }

    const contentType = parseContentType(
      getHeader(part.headers, 'Content-Type')
    );
    if (contentType.name) filename = contentType.name;

    // Calculate real size (base64 is ~33% larger than actual)
    let realSize = part.content.length;
    const enc = (part.encoding || '').toLowerCase();
    if (enc === 'base64') {
      const cleaned = part.content.replace(/\s/g, '');
      const padding = (cleaned.match(/=+$/) || [''])[0].length;
      realSize = Math.floor((cleaned.length * 3) / 4) - padding;
    }

    const attachment: EmailAttachment = {
      filename,
      contentType: part.contentType,
      size: realSize,
      encoding: part.encoding || '7bit',
      content: part.content,
      contentId: contentId?.replace(/^<|>$/g, ''),
      disposition: disposition?.split(';')[0].trim(),
    };

    // Determine if inline or attachment
    if (
      disposition?.toLowerCase().startsWith('inline') ||
      (contentId && part.contentType.startsWith('image/'))
    ) {
      inlineImages.push(attachment);
    } else if (
      disposition?.toLowerCase().startsWith('attachment') ||
      !part.contentType.startsWith('text/')
    ) {
      attachments.push(attachment);
    }
  }

  return { attachments, inlineImages };
}

/**
 * Converts CID references to data URIs in HTML
 */
function convertCidReferencesToDataUri(
  html: string,
  inlineImages: EmailAttachment[]
): string {
  let result = html;

  for (const image of inlineImages) {
    if (!image.contentId) continue;

    try {
      // Decode base64 image content
      const imageData = image.content.replace(/\s/g, '');
      const dataUri = `data:${image.contentType};base64,${imageData}`;

      // Replace cid: references
      const cidPattern = new RegExp(
        `cid:${image.contentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'gi'
      );
      result = result.replace(cidPattern, dataUri);
    } catch (e) {
      // Skip invalid images
    }
  }

  return result;
}

/**
 * Detects tracking pixels in HTML
 */
function hasTrackingPixels(html: string): boolean {
  if (!html) return false;

  // Look for 1x1 images or common tracking patterns
  const trackingPatterns = [
    /<img[^>]*width\s*=\s*["']?1["']?[^>]*height\s*=\s*["']?1["']?/i,
    /<img[^>]*height\s*=\s*["']?1["']?[^>]*width\s*=\s*["']?1["']?/i,
    /tracking\.(gif|png|jpg)/i,
    /pixel\.(gif|png|jpg)/i,
    /open\.gif/i,
  ];

  return trackingPatterns.some((pattern) => pattern.test(html));
}

/**
 * Detects email client from headers
 */
function detectEmailClient(headers: EmailHeader[]): string | undefined {
  const mailer = getHeader(headers, 'X-Mailer');
  const userAgent = getHeader(headers, 'User-Agent');
  const xOriginating = getHeader(headers, 'X-Originating-IP');

  if (mailer) {
    if (/outlook/i.test(mailer)) return 'Microsoft Outlook';
    if (/thunderbird/i.test(mailer)) return 'Mozilla Thunderbird';
    if (/apple mail/i.test(mailer)) return 'Apple Mail';
    if (/gmail/i.test(mailer)) return 'Gmail';
    return mailer;
  }

  if (userAgent) {
    if (/outlook/i.test(userAgent)) return 'Microsoft Outlook';
    if (/thunderbird/i.test(userAgent)) return 'Mozilla Thunderbird';
    return userAgent;
  }

  return undefined;
}

/**
 * Detects email template type
 */
function detectTemplateType(
  html: string,
  headers: EmailHeader[]
): string | undefined {
  if (!html) return undefined;

  const patterns = [
    { name: 'MailChimp', pattern: /mailchimp/i },
    { name: 'SendGrid', pattern: /sendgrid/i },
    { name: 'Mailgun', pattern: /mailgun/i },
    { name: 'Amazon SES', pattern: /amazonses/i },
    { name: 'Constant Contact', pattern: /constantcontact/i },
    { name: 'Campaign Monitor', pattern: /createsend/i },
  ];

  for (const { name, pattern } of patterns) {
    if (pattern.test(html)) return name;

    // Check headers too
    const xMailer = getHeader(headers, 'X-Mailer');
    if (xMailer && pattern.test(xMailer)) return name;
  }

  return undefined;
}

/**
 * Checks if email has authentication headers
 */
function hasAuthenticationHeaders(headers: EmailHeader[]): boolean {
  const dkim = getHeader(headers, 'DKIM-Signature');
  const spf = getHeader(headers, 'Received-SPF');
  const authResults = getHeader(headers, 'Authentication-Results');

  return !!(dkim || spf || authResults);
}

/**
 * Converts plain text to HTML
 */
function textToHtml(text: string): string {
  if (!text) return '';

  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Convert line breaks to <br>
  const withBreaks = escaped.replace(/\n/g, '<br>');

  // Wrap in basic HTML
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <pre>${withBreaks}</pre>
</body>
</html>`;
}

/**
 * Main EML parsing function
 */
export function parseEml(emlContent: string): ParsedEmail | null {
  if (!emlContent || !emlContent.trim()) {
    return null;
  }

  try {
    // Find the boundary between headers and body
    const headerBodySplit = emlContent.search(/\r?\n\r?\n/);

    if (headerBodySplit === -1) {
      // No body, only headers (malformed)
      return null;
    }

    const headerText = emlContent.substring(0, headerBodySplit);
    const bodyText = emlContent.substring(headerBodySplit).trim();

    // Parse headers
    const headers = parseHeaders(headerText);

    // Extract common headers
    const from = getHeader(headers, 'From');
    const to = getHeader(headers, 'To')
      ?.split(',')
      .map((t) => t.trim());
    const cc = getHeader(headers, 'Cc')
      ?.split(',')
      .map((t) => t.trim());
    const bcc = getHeader(headers, 'Bcc')
      ?.split(',')
      .map((t) => t.trim());
    const subject = getHeader(headers, 'Subject');
    const date = getHeader(headers, 'Date');
    const messageId = getHeader(headers, 'Message-ID');
    const inReplyTo = getHeader(headers, 'In-Reply-To');
    const references = getHeader(headers, 'References')?.split(/\s+/);

    const contentTypeHeader = getHeader(headers, 'Content-Type');
    const contentType = parseContentType(contentTypeHeader);
    const encoding = getHeader(headers, 'Content-Transfer-Encoding');

    let parts: EmailPart[] = [];
    let textBody: string | undefined;
    let htmlBody: string | undefined;
    let attachments: EmailAttachment[] = [];
    let inlineImages: EmailAttachment[] = [];

    // Parse body based on content type
    if (contentType.type.startsWith('multipart/') && contentType.boundary) {
      // Multipart message
      parts = parseMultipart(bodyText, contentType.boundary, headers);

      const bodies = extractBodies(parts);
      textBody = bodies.textBody;
      htmlBody = bodies.htmlBody;

      const extracted = extractAttachments(parts);
      attachments = extracted.attachments;
      inlineImages = extracted.inlineImages;
    } else if (contentType.type.startsWith('text/html')) {
      // Single HTML body
      htmlBody = decodeContent(bodyText, encoding);
    } else if (contentType.type.startsWith('text/plain')) {
      // Single plain text body
      textBody = decodeContent(bodyText, encoding);
    } else {
      // Unknown content type, treat as plain text
      textBody = bodyText;
    }

    const parsedEmail: ParsedEmail = {
      headers,
      from,
      to,
      cc,
      bcc,
      subject,
      date,
      messageId,
      inReplyTo,
      references,
      textBody,
      htmlBody,
      attachments,
      inlineImages,
      contentType: contentType.type,
      boundary: contentType.boundary,
      parts,
      rawHeaders: headerText,
      hasAuthentication: hasAuthenticationHeaders(headers),
      hasTracking: htmlBody ? hasTrackingPixels(htmlBody) : false,
      clientDetection: detectEmailClient(headers),
      templateType: detectTemplateType(htmlBody || '', headers),
    };

    return parsedEmail;
  } catch (error) {
    console.error('Error parsing EML:', error);
    return null;
  }
}

/**
 * Converts parsed email to HTML
 */
export function convertToHtml(
  parsedEmail: ParsedEmail,
  options: ConversionOptions = {}
): string {
  const {
    sanitizeHtml = true,
    removeScripts = true,
    convertCidToDataUri = true,
    includeHeaders = true,
  } = options;

  let html = parsedEmail.htmlBody;

  // If no HTML body, convert text to HTML
  if (!html && parsedEmail.textBody) {
    html = textToHtml(parsedEmail.textBody);
  }

  // If still no HTML, return empty
  if (!html) {
    html = '<html><body><p>No content to display</p></body></html>';
  }

  // Convert CID references to data URIs
  if (convertCidToDataUri && parsedEmail.inlineImages.length > 0) {
    html = convertCidReferencesToDataUri(html, parsedEmail.inlineImages);
  }

  // Sanitize HTML
  if (sanitizeHtml) {
    html = sanitizeHtmlContent(html, removeScripts);
  }

  return html;
}

/**
 * Generates headers HTML table
 */
export function generateHeadersHtml(parsedEmail: ParsedEmail): string {
  const importantHeaders = [
    'From',
    'To',
    'Cc',
    'Bcc',
    'Subject',
    'Date',
    'Message-ID',
    'In-Reply-To',
    'References',
    'DKIM-Signature',
    'SPF',
    'Authentication-Results',
    'X-Mailer',
    'User-Agent',
  ];

  const headersHtml = parsedEmail.headers
    .map((header) => {
      const isImportant = importantHeaders.some(
        (h) => h.toLowerCase() === header.name.toLowerCase()
      );
      const isAuth = [
        'dkim-signature',
        'spf',
        'authentication-results',
      ].includes(header.name.toLowerCase());

      const rowClass = isAuth ? 'bg-green-50' : '';
      const nameClass = isImportant ? 'font-bold' : '';

      return `
        <tr class="${rowClass}">
          <td class="border px-4 py-2 ${nameClass}">${header.name}</td>
          <td class="border px-4 py-2 break-all">${header.value}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-4 py-2 text-left">Header</th>
          <th class="border px-4 py-2 text-left">Value</th>
        </tr>
      </thead>
      <tbody>
        ${headersHtml}
      </tbody>
    </table>
  `;
}

/**
 * Extracts all links from HTML content
 */
export function extractLinks(html: string): ExtractedLink[] {
  if (!html) return [];

  const links: ExtractedLink[] = [];
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const trackingPatterns = [
    /click\./i, /track\./i, /redirect\./i, /link\./i,
    /utm_/i, /\?ref=/i, /\/click\?/i, /\/track\?/i,
    /mailchimp\.com/i, /sendgrid\.net/i, /list-manage\.com/i,
  ];

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const rawText = match[2].replace(/<[^>]*>/g, '').trim();
    const text = rawText || url;

    // Skip mailto, tel, cid
    if (/^(mailto:|tel:|cid:|#)/i.test(url)) continue;

    const isTracking = trackingPatterns.some((p) => p.test(url));
    links.push({ url, text, isTracking });
  }

  return links;
}

/**
 * Main conversion function
 */
export function convertEmlToHtml(
  emlContent: string,
  options: ConversionOptions = {}
): ConversionResult {
  const warnings: string[] = [];

  // Reset decode warnings
  _decodeWarnings = [];

  // Validate input
  if (!emlContent || !emlContent.trim()) {
    return {
      success: false,
      error: 'Empty EML content',
    };
  }

  // Parse EML
  const parsedEmail = parseEml(emlContent);

  if (!parsedEmail) {
    return {
      success: false,
      error:
        'Failed to parse EML file. Please ensure it is a valid RFC822/2822 email format.',
    };
  }

  // Generate HTML views
  const html = convertToHtml(parsedEmail, options);
  const headersHtml = generateHeadersHtml(parsedEmail);
  const rawView = emlContent;
  const sourceView = parsedEmail.htmlBody || '';

  // Extract links from HTML
  const links = extractLinks(html);

  // Add warnings
  if (parsedEmail.hasTracking) {
    warnings.push('This email contains tracking pixels');
  }

  if (parsedEmail.attachments.length > 0) {
    warnings.push(
      `Email contains ${parsedEmail.attachments.length} attachment(s)`
    );
  }

  const maxSize = options.maxAttachmentSize || 10 * 1024 * 1024; // 10MB default
  const largeAttachments = parsedEmail.attachments.filter(
    (a) => a.size > maxSize
  );
  if (largeAttachments.length > 0) {
    warnings.push(`${largeAttachments.length} attachment(s) exceed size limit`);
  }

  // Add decode warnings
  warnings.push(..._decodeWarnings);

  return {
    success: true,
    html,
    headersHtml,
    rawView,
    sourceView,
    parsedEmail,
    warnings: warnings.length > 0 ? warnings : undefined,
    links: links.length > 0 ? links : undefined,
  };
}

/**
 * Exports headers as JSON
 */
export function exportHeadersAsJson(parsedEmail: ParsedEmail): string {
  const headersObj: Record<string, string | string[]> = {};

  for (const header of parsedEmail.headers) {
    const key = header.name;
    if (headersObj[key]) {
      // Multiple values for same header
      if (Array.isArray(headersObj[key])) {
        (headersObj[key] as string[]).push(header.value);
      } else {
        headersObj[key] = [headersObj[key] as string, header.value];
      }
    } else {
      headersObj[key] = header.value;
    }
  }

  return JSON.stringify(headersObj, null, 2);
}

/**
 * Exports email summary
 */
export function getEmailSummary(parsedEmail: ParsedEmail): {
  from: string;
  to: string[];
  subject: string;
  date: string;
  hasAttachments: boolean;
  attachmentCount: number;
  hasHtml: boolean;
  hasText: boolean;
  hasAuthentication: boolean;
  hasTracking: boolean;
  client?: string;
  template?: string;
} {
  return {
    from: parsedEmail.from || 'Unknown',
    to: parsedEmail.to || [],
    subject: parsedEmail.subject || '(No Subject)',
    date: parsedEmail.date || 'Unknown',
    hasAttachments: parsedEmail.attachments.length > 0,
    attachmentCount: parsedEmail.attachments.length,
    hasHtml: !!parsedEmail.htmlBody,
    hasText: !!parsedEmail.textBody,
    hasAuthentication: parsedEmail.hasAuthentication,
    hasTracking: parsedEmail.hasTracking,
    client: parsedEmail.clientDetection,
    template: parsedEmail.templateType,
  };
}
