/**
 * IndexNow Client for submitting URLs to search engines
 * Supports Bing, Yandex, and other IndexNow-compatible search engines
 */

export interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation?: string;
  urls: string[];
}

export interface SubmissionResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  submittedUrls?: string[];
  failedUrls?: string[];
  timestamp: number;
}

export class IndexNowClient {
  private host: string;
  private key: string;
  private keyLocation: string;
  private endpoints: string[] = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];
  private maxUrlsPerRequest = 10000;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(config?: {
    maxRetries?: number;
    retryDelay?: number;
    endpoints?: string[];
  }) {
    this.host = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolslab.dev';
    this.key = process.env.INDEXNOW_KEY || '3f6e2560c38248588ea3fc34a1a817a5';
    this.keyLocation = `${this.host}/${this.key}.txt`;
    if (config?.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config?.retryDelay !== undefined) this.retryDelay = config.retryDelay;
    if (config?.endpoints) this.endpoints = config.endpoints;
  }

  /**
   * Submit multiple URLs to IndexNow
   */
  async submitUrls(urls: string[]): Promise<SubmissionResult> {
    if (!urls || urls.length === 0) {
      return {
        success: false,
        message: 'No URLs provided',
        timestamp: Date.now(),
      };
    }

    // Validate all URLs belong to our domain
    const validUrls = urls.filter((url) => this.isValidUrl(url));
    if (validUrls.length === 0) {
      return {
        success: false,
        message: 'No valid URLs for submission',
        failedUrls: urls,
        timestamp: Date.now(),
      };
    }

    // Split into batches if necessary
    if (validUrls.length > this.maxUrlsPerRequest) {
      return await this.submitBatch(validUrls);
    }

    // Prepare submission data
    const submission: IndexNowSubmission = {
      host: new URL(this.host).hostname,
      key: this.key,
      keyLocation: this.keyLocation,
      urls: validUrls,
    };

    // Try each endpoint with retry logic
    let lastResult: SubmissionResult | undefined;
    for (const endpoint of this.endpoints) {
      lastResult = await this.submitToEndpoint(endpoint, submission);
      if (lastResult.success) {
        return lastResult;
      }
    }

    return {
      success: false,
      message: `All IndexNow endpoints failed${lastResult?.message ? `: ${lastResult.message}` : ''}`,
      failedUrls: validUrls,
      timestamp: Date.now(),
    };
  }

  /**
   * Submit a single URL to IndexNow
   */
  async submitSingle(url: string): Promise<SubmissionResult> {
    return this.submitUrls([url]);
  }

  /**
   * Submit large batches of URLs (splits automatically)
   */
  async submitBatch(urls: string[]): Promise<SubmissionResult> {
    const results: SubmissionResult[] = [];
    const batches = this.splitIntoBatches(urls, this.maxUrlsPerRequest);

    for (const batch of batches) {
      const result = await this.submitUrls(batch);
      results.push(result);

      // Add delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(500);
      }
    }

    // Aggregate results
    const allSubmitted: string[] = [];
    const allFailed: string[] = [];
    let allSuccess = true;

    for (const result of results) {
      if (result.submittedUrls) {
        allSubmitted.push(...result.submittedUrls);
      }
      if (result.failedUrls) {
        allFailed.push(...result.failedUrls);
      }
      if (!result.success) {
        allSuccess = false;
      }
    }

    return {
      success: allSuccess,
      message: `Submitted ${allSubmitted.length} URLs in ${batches.length} batches`,
      submittedUrls: allSubmitted,
      failedUrls: allFailed.length > 0 ? allFailed : undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * Submit to a specific IndexNow endpoint with retry logic
   */
  private async submitToEndpoint(
    endpoint: string,
    submission: IndexNowSubmission,
    retryCount = 0
  ): Promise<SubmissionResult> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      // Success codes: 200, 202
      if (response.ok || response.status === 202) {
        return {
          success: true,
          statusCode: response.status,
          message: `Successfully submitted ${submission.urls.length} URLs`,
          submittedUrls: submission.urls,
          timestamp: Date.now(),
        };
      }

      // Rate limiting - retry with exponential backoff
      if (response.status === 429 && retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.submitToEndpoint(endpoint, submission, retryCount + 1);
      }

      // Other errors
      return {
        success: false,
        statusCode: response.status,
        message: `Failed with status ${response.status}`,
        failedUrls: submission.urls,
        timestamp: Date.now(),
      };
    } catch (error) {
      // Network error - retry if under limit
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.submitToEndpoint(endpoint, submission, retryCount + 1);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
        failedUrls: submission.urls,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate URL belongs to our domain
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostObj = new URL(this.host);
      return urlObj.hostname === hostObj.hostname;
    } catch {
      return false;
    }
  }

  /**
   * Split array into batches
   */
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get submission statistics
   */
  async getStats(): Promise<
    {
      endpoint: string;
      available: boolean;
    }[]
  > {
    const stats = [];

    for (const endpoint of this.endpoints) {
      try {
        const response = await fetch(endpoint, { method: 'HEAD' });
        stats.push({
          endpoint,
          available: response.ok || response.status === 405, // 405 means endpoint exists but HEAD not allowed
        });
      } catch {
        stats.push({
          endpoint,
          available: false,
        });
      }
    }

    return stats;
  }
}

// Singleton instance
export const indexNowClient = new IndexNowClient();
