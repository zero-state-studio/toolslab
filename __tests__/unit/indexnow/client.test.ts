/**
 * Unit tests for IndexNow Client
 */

import { IndexNowClient } from '@/lib/indexnow/client';

// Mock fetch
global.fetch = jest.fn();

describe('IndexNowClient', () => {
  let client: IndexNowClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://toolslab.dev';
    process.env.INDEXNOW_KEY = 'test-key-123';
    client = new IndexNowClient();
  });

  describe('submitSingle', () => {
    it('should submit a single URL successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const result = await client.submitSingle(
        'https://toolslab.dev/tools/json-formatter'
      );

      expect(result.success).toBe(true);
      expect(result.submittedUrls).toContain(
        'https://toolslab.dev/tools/json-formatter'
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('indexnow'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('json-formatter'),
        })
      );
    });

    it('should reject URLs from different domains', async () => {
      const result = await client.submitSingle('https://example.com/page');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No valid URLs');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 202 status as success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 202,
        json: async () => ({}),
      });

      const result = await client.submitSingle(
        'https://toolslab.dev/tools/base64'
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(202);
    });
  });

  describe('submitUrls', () => {
    it('should submit multiple URLs in a single request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const urls = [
        'https://toolslab.dev/tools/json-formatter',
        'https://toolslab.dev/tools/base64',
        'https://toolslab.dev/tools/jwt-decoder',
      ];

      const result = await client.submitUrls(urls);

      expect(result.success).toBe(true);
      expect(result.submittedUrls).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should filter out invalid URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const urls = [
        'https://toolslab.dev/tools/valid',
        'https://example.com/invalid',
        'not-a-url',
        'https://toolslab.dev/tools/another-valid',
      ];

      const result = await client.submitUrls(urls);

      expect(result.success).toBe(true);
      expect(result.submittedUrls).toHaveLength(2);
      expect(result.submittedUrls).toContain(
        'https://toolslab.dev/tools/valid'
      );
      expect(result.submittedUrls).toContain(
        'https://toolslab.dev/tools/another-valid'
      );
    });

    it('should return error for empty URL list', async () => {
      const result = await client.submitUrls([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No URLs provided');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('submitBatch', () => {
    it('should split large batches automatically', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Create array with 15000 URLs (exceeds 10000 limit)
      const urls = Array.from(
        { length: 15000 },
        (_, i) => `https://toolslab.dev/page-${i}`
      );

      const result = await client.submitBatch(urls);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 batches');
      expect(fetch).toHaveBeenCalledTimes(2); // Two batches
    });
  });

  describe('retry logic', () => {
    it('should retry on rate limiting (429)', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({}),
        });
      });

      const result = await client.submitSingle(
        'https://toolslab.dev/tools/test'
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({}),
        });
      });

      const result = await client.submitSingle(
        'https://toolslab.dev/tools/test'
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Single endpoint + 1ms backoff: with the real 3 endpoints and
      // exponential 1s backoff this test would take ~21s (12 fetches)
      const fastClient = new IndexNowClient({
        endpoints: ['https://api.indexnow.org/indexnow'],
        retryDelay: 1,
      });
      const result = await fastClient.submitSingle(
        'https://toolslab.dev/tools/test'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
      expect(fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('getStats', () => {
    it('should check endpoint availability', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 405 })
        .mockRejectedValueOnce(new Error('Network error'));

      const stats = await client.getStats();

      expect(stats).toHaveLength(3);
      expect(stats[0].available).toBe(true);
      expect(stats[1].available).toBe(true); // 405 is considered available
      expect(stats[2].available).toBe(false);
    });
  });
});
