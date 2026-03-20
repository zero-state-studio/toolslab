import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientKey } from '@/lib/api/rateLimit';

/**
 * Remove JavaScript from HTML before returning it to the client.
 * Strips <script> blocks, inline event handlers, and javascript: hrefs.
 */
function stripScripts(html: string): string {
  return (
    html
      // Remove <script ...>...</script> (including multiline, type variations)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      // Remove <noscript>...</noscript>
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, '')
      // Remove inline event handlers (on*)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // Remove javascript: in href/src/action attributes
      .replace(
        /(href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi,
        '$1="#"'
      )
  );
}

const MAX_SIZE = 1 * 1024 * 1024; // 1MB
const TIMEOUT_MS = 8000;
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^24[0-9]\./,
  /^25[0-5]\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i,
];

function isPrivateHost(hostname: string): boolean {
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Rate limiting (10 req/min per IP)
  const clientKey = getClientKey(request);
  const rl = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyGenerator: () => `fetch-url:${clientKey}`,
    message: 'Too many requests. Please wait before fetching another URL.',
  });

  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(rl.remaining ?? 0),
  };

  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        error: rl.message ?? 'Rate limit exceeded. Please try again later.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 429, headers }
    );
  }

  // Validate URL presence
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'URL parameter is required.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 400, headers }
    );
  }

  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid URL format.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 400, headers }
    );
  }

  // Only http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json(
      {
        success: false,
        error: 'Only http and https URLs are supported.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 400, headers }
    );
  }

  // SSRF protection — block private/local hosts
  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Access to private or local addresses is not allowed.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 400, headers }
    );
  }

  // Port restriction
  if (parsed.port) {
    const port = parseInt(parsed.port, 10);
    if (!ALLOWED_PORTS.has(port)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only ports 80, 443, 8080, and 8443 are allowed.',
          timestamp,
          responseTime: Date.now() - startTime,
        },
        { status: 400, headers }
      );
    }
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ToolsLab/1.0; +https://toolslab.dev)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Content-Length check (before streaming)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page is too large to fetch (limit: 1MB).',
          timestamp,
          responseTime: Date.now() - startTime,
        },
        { status: 413, headers }
      );
    }

    // Content-Type validation
    const contentType = response.headers.get('content-type') ?? '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL does not point to an HTML page.',
          timestamp,
          responseTime: Date.now() - startTime,
        },
        { status: 415, headers }
      );
    }

    // Stream with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read response from server.',
          timestamp,
          responseTime: Date.now() - startTime,
        },
        { status: 502, headers }
      );
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > MAX_SIZE) {
        reader.cancel();
        return NextResponse.json(
          {
            success: false,
            error: 'Page is too large to fetch (limit: 1MB).',
            timestamp,
            responseTime: Date.now() - startTime,
          },
          { status: 413, headers }
        );
      }
      chunks.push(value);
    }

    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const rawHtml = new TextDecoder('utf-8').decode(combined);
    const html = stripScripts(rawHtml);

    return NextResponse.json(
      {
        success: true,
        html,
        url: rawUrl,
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 200, headers }
    );
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timed out. The server took too long to respond.',
          timestamp,
          responseTime: Date.now() - startTime,
        },
        { status: 408, headers }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch the URL. Check that the address is reachable.',
        timestamp,
        responseTime: Date.now() - startTime,
      },
      { status: 502, headers }
    );
  }
}
