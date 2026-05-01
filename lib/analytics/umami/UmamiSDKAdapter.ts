// UmamiSDKAdapter - Adapter per Umami SDK v3
// Responsabilità:
// - Interfaccia con window.umami.track()
// - Conversione eventi interni → formato Umami
// - Invio sequenziale per preservare ordine
// - Gestione errori SDK

import type { AnalyticsEvent } from '../types/events';
import type { AnalyticsConfig } from '../config';
import { CRITICAL_EVENTS, PII_PATTERNS } from '../config';
import { UmamiEventQueue } from './UmamiEventQueue';
import { botDetector } from '../botDetection';

// Delay between sequential events (ms)
const SEQUENTIAL_DELAY_MS = 10;

/**
 * Adapter per comunicare con Umami SDK
 * Gestisce l'interfaccia con window.umami.track() in modo type-safe
 */
export class UmamiSDKAdapter {
  private config: AnalyticsConfig;
  private queue: UmamiEventQueue;
  private isBot: boolean = false;
  // Events queued while SDK was not yet loaded
  private pendingEvents: AnalyticsEvent[] = [];
  private waitingForSDK: boolean = false;
  private sdkWaitTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.queue = new UmamiEventQueue(config);

    // Set flush callback
    this.queue.setFlushCallback((events) =>
      this.sendEventsSequentially(events)
    );

    // Bot detection (client-side only)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const detection = botDetector.detectBot(
        navigator.userAgent,
        document.referrer,
        window.location.href
      );
      this.isBot = detection.isBot;

      if (this.isBot) {
        this.log('🤖 Bot detected, analytics disabled:', detection.reason);
      }
    }

    // Listen for page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    }

    this.log('UmamiSDKAdapter initialized', {
      config: this.config,
      isBot: this.isBot,
    });
  }

  /**
   * Traccia un evento analytics
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) {
      this.log('Tracking disabled, ignoring event', event.event);
      return;
    }

    // 🚨 CRITICAL: Block localhost/127.0.0.1 - NEVER track local development
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
      ) {
        this.log(
          '🚫 Localhost detected, skipping analytics event',
          event.event
        );
        return;
      }
    }

    // Check if bot (no tracking for bots)
    if (this.isBot) {
      this.log('🤖 Bot detected, skipping event', event.event);
      return;
    }

    // Check Do Not Track
    if (
      this.config.privacy.respectDNT &&
      typeof navigator !== 'undefined' &&
      (navigator.doNotTrack === '1' || (navigator as any).doNotTrack === 'yes')
    ) {
      this.log('DNT enabled, ignoring event', event.event);
      return;
    }

    // Sanitize PII if enabled
    if (this.config.privacy.sanitizePII) {
      event = this.sanitizePII(event);
    }

    this.log('✅ Tracking event', event.event);

    // Check if should flush immediately (critical events)
    const shouldFlushImmediately = this.isCriticalEvent(event);

    // Enqueue event
    this.queue.enqueue(event, shouldFlushImmediately);
  }

  /**
   * Flush manuale della queue
   */
  async flush(): Promise<void> {
    this.queue.flush();
  }

  /**
   * Invia eventi all'SDK Umami in sequenza
   * Gli eventi sono già ordinati cronologicamente dalla queue
   */
  private sendEventsSequentially(events: AnalyticsEvent[]): void {
    if (!this.isSDKReady()) {
      // Hold events until SDK loads instead of silently dropping
      this.pendingEvents.push(...events);
      this.log(
        `⏳ SDK not ready, holding ${events.length} events (pending=${this.pendingEvents.length})`
      );
      this.waitForSDK();
      return;
    }

    // SDK is ready: drain any pending backlog first (chronological)
    if (this.pendingEvents.length > 0) {
      const backlog = this.pendingEvents.sort((a, b) => {
        const aT = a.timestamp ?? 0;
        const bT = b.timestamp ?? 0;
        return aT - bT;
      });
      this.pendingEvents = [];
      events = [...backlog, ...events];
      this.log(`🔁 Draining ${backlog.length} pending events`);
    }

    // Send each event with micro-delay to preserve order
    events.forEach((event, index) => {
      setTimeout(() => {
        try {
          this.trackSingleEvent(event);
          this.log(`📤 Event ${index + 1}/${events.length}: ${event.event}`);
        } catch (err) {
          this.log(`❌ Failed to send event: ${event.event}`, err);
          // No retry - sendBeacon is already best-effort guaranteed delivery
        }
      }, index * SEQUENTIAL_DELAY_MS);
    });

    this.log(
      `✅ Queued ${events.length} events for Umami SDK`,
      events.map((e) => e.event)
    );
  }

  /**
   * Traccia singolo evento via Umami SDK
   * Usa sendBeacon() se la tab è hidden per garantire delivery
   */
  private trackSingleEvent(event: AnalyticsEvent): void {
    if (!this.isSDKReady()) {
      throw new Error('Umami SDK not loaded');
    }

    const { event: eventName, timestamp, sessionId, ...metadata } = event;

    // Prepare event data - include all metadata except internal sessionId
    // We want locale, userLevel, viewport, isMobile in custom events for analysis
    const eventData: Record<string, any> = {
      ...metadata,
    };

    // Add timestamp if provided (optional - Umami can auto-assign)
    if (timestamp) {
      eventData.timestamp = Math.floor(timestamp / 1000); // Convert ms to seconds
    }

    // Log tracking attempt (development + production for debugging)
    console.log(`[Umami] Tracking "${eventName}"`, eventData);

    // Check if tab is hidden AND event is critical
    const isTabHidden =
      typeof document !== 'undefined' && document.hidden === true;
    const isCritical = this.isCriticalEvent(event);

    // Use sendBeacon for critical events when tab is hidden
    if (isTabHidden && isCritical && typeof navigator !== 'undefined') {
      console.log(`[Umami] Using sendBeacon for critical event: ${eventName}`);
      this.trackWithBeacon(eventName, eventData);
      return;
    }

    // Standard event tracking - Umami SDK handles everything
    // Always use eventName as first parameter, data as second
    console.log(`[Umami] Calling umami.track("${eventName}", ...)`, {
      umamiExists: typeof (window as any).umami !== 'undefined',
      trackExists: typeof (window as any).umami?.track === 'function',
      eventData,
    });

    (window as any).umami.track(eventName, eventData);
    console.log(`[Umami] ✅ umami.track() called successfully`);
  }

  /**
   * Send event using sendBeacon API for guaranteed delivery
   * Used when tab is hidden or page is unloading
   */
  private trackWithBeacon(eventName: string, data: any): void {
    try {
      // Get Umami endpoint from SDK
      const endpoint =
        typeof (window as any).umami?.endpoint === 'string'
          ? (window as any).umami.endpoint
          : '/api/send';

      // Prepare payload in Umami format
      const payload = JSON.stringify({
        payload: {
          website: (window as any).umami?.websiteId,
          name: eventName,
          data,
        },
        type: 'event',
      });

      // Send via beacon (guaranteed delivery even if page closes)
      const sent = navigator.sendBeacon(endpoint, payload);

      if (!sent) {
        this.log(
          `⚠️ sendBeacon failed (queue full?), falling back to umami.track()`
        );
        // Fallback to normal tracking
        (window as any).umami.track(eventName, data);
      }
    } catch (error) {
      this.log(`❌ sendBeacon error, falling back:`, error);
      // Fallback to normal tracking
      (window as any).umami.track(eventName, data);
    }
  }

  /**
   * Handle page unload - flush ALL pending events SYNCHRONOUSLY
   */
  private handleBeforeUnload(): void {
    this.log('Page unloading, flushing ALL pending events');

    if (!this.isSDKReady()) {
      this.log('❌ SDK not ready on unload');
      return;
    }

    // Get all pending events (sorted)
    const sortedEvents = this.queue.flushSync();

    if (sortedEvents.length === 0) {
      return;
    }

    this.log(
      `📤 Sending ${sortedEvents.length} events synchronously on unload`,
      sortedEvents.map((e) => e.event)
    );

    // ⚡ CRITICAL: Send synchronously (no setTimeout) during page unload
    // The browser may kill async operations during beforeunload
    sortedEvents.forEach((event) => {
      try {
        this.trackSingleEvent(event);
        this.log(`✅ Sent on unload: ${event.event}`);
      } catch (err) {
        this.log(`❌ Failed to send on unload: ${event.event}`, err);
      }
    });
  }

  /**
   * Check if Umami SDK is ready
   */
  private isSDKReady(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as any).umami?.track === 'function'
    );
  }

  /**
   * Poll for SDK readiness, then re-flush queue so pending events go out.
   * Idempotent: safe to call multiple times.
   * Times out after 10 seconds.
   */
  private waitForSDK(): void {
    if (this.waitingForSDK) return;
    if (typeof window === 'undefined') return;
    this.waitingForSDK = true;

    let attempts = 0;
    const MAX_ATTEMPTS = 100; // 100 * 100ms = 10s

    const tick = () => {
      attempts += 1;
      if (this.isSDKReady()) {
        this.waitingForSDK = false;
        this.sdkWaitTimer = null;
        this.log(`✅ SDK ready after ${attempts} polls — flushing pending`);
        // Trigger flush so the holding-bucket gets drained
        if (this.pendingEvents.length > 0) {
          // Send pending events (sendEventsSequentially will drain them)
          this.sendEventsSequentially([]);
        }
        return;
      }
      if (attempts >= MAX_ATTEMPTS) {
        this.waitingForSDK = false;
        this.sdkWaitTimer = null;
        this.log(
          `⚠️ SDK never became ready — dropping ${this.pendingEvents.length} pending`
        );
        this.pendingEvents = [];
        return;
      }
      this.sdkWaitTimer = setTimeout(tick, 100);
    };

    this.sdkWaitTimer = setTimeout(tick, 100);
  }

  /**
   * Check if event is critical (requires immediate flush)
   */
  private isCriticalEvent(event: AnalyticsEvent): boolean {
    return CRITICAL_EVENTS.includes(event.event as any);
  }

  /**
   * Validate timestamp value
   */
  private isValidTimestamp(timestamp: number | undefined): boolean {
    if (timestamp === undefined || timestamp === null) {
      return false;
    }

    if (isNaN(timestamp)) {
      return false;
    }

    // Check if timestamp is within reasonable range
    // Min: 2020-01-01 (1577836800000)
    // Max: 2100-01-01 (4102444800000)
    if (timestamp < 1577836800000 || timestamp > 4102444800000) {
      this.log(`⚠️ Timestamp out of range: ${timestamp}`);
      return false;
    }

    return true;
  }

  /**
   * Sanitize PII from event metadata
   */
  private sanitizePII(event: AnalyticsEvent): AnalyticsEvent {
    const sanitized = { ...event };

    // Recursively sanitize all string values
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove emails, IPs, etc.
        return obj
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
          .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]')
          .replace(/\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g, '[IP]')
          .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
      }

      if (typeof obj === 'object' && obj !== null) {
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          result[key] = sanitizeObject(obj[key]);
        }
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Config updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Get queue status (for debug panel)
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      sdkReady: this.isSDKReady(),
      ...this.queue.getStatus(),
    };
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (!this.config.debug) return;

    if (data) {
      console.log(`[UmamiSDKAdapter] ${message}`, data);
    } else {
      console.log(`[UmamiSDKAdapter] ${message}`);
    }
  }
}

// Singleton instance
let instance: UmamiSDKAdapter | null = null;

export function getUmamiAdapter(): UmamiSDKAdapter {
  if (!instance) {
    const { getAnalyticsConfig } = require('../config');
    instance = new UmamiSDKAdapter(getAnalyticsConfig());
  }
  return instance;
}
