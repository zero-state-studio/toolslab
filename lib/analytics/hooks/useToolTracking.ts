'use client';

import { useCallback } from 'react';
import { getUmamiAdapter } from '@/lib/analytics/umami/UmamiSDKAdapter';
import { getUmamiSessionTracker } from '@/lib/analytics/umami/UmamiSessionTracker';
import { EventNormalizer } from '../core/EventNormalizer';
import type { ToolUseEvent } from '../types/events';

/**
 * Hook for manual tool tracking
 * Use this when a tool doesn't save to history (stateless tools)
 *
 * Example:
 * ```typescript
 * const { trackUse } = useToolTracking('json-formatter');
 *
 * const handleFormat = (input: string) => {
 *   const output = formatJSON(input);
 *   trackUse(input, output);  // ✅ Tracked!
 *   return output;
 * };
 * ```
 */
export function useToolTracking(toolId: string) {
  /**
   * Track tool usage
   * Call this when your tool processes data
   */
  const trackUse = useCallback(
    (
      input: string,
      output: string,
      metadata?: {
        processingTime?: number;
        success?: boolean;
        error?: string;
        source?: string;
        sourceUrl?: string;
      }
    ) => {
      try {
        const manager = getUmamiAdapter();
        const session = getUmamiSessionTracker();

        const inputSize = EventNormalizer.getByteSize(input);
        const outputSize = EventNormalizer.getByteSize(output);
        const success = metadata?.success !== false && !metadata?.error;

        // If there's an error, track as error event instead
        if (metadata?.error) {
          const errorEvent = EventNormalizer.enrichEvent({
            event: 'tool.error' as const,
            tool: toolId,
            errorType: 'ProcessingError',
            errorMessage: EventNormalizer.truncate(metadata.error, 200),
            inputSize,
            sessionId: '',
          });
          manager.track(errorEvent);
        } else {
          // Track successful use
          const event = EventNormalizer.enrichEvent({
            event: 'tool.use' as const,
            tool: toolId,
            inputSize,
            outputSize,
            processingTime: metadata?.processingTime,
            success,
            sessionId: '',
            ...(metadata?.source ? { source: metadata.source } : {}),
            ...(metadata?.sourceUrl ? { sourceUrl: metadata.sourceUrl } : {}),
          });
          manager.track(event);
        }

        // Update session
        session?.addToolUsed(toolId);
        session?.incrementEvent();

        if (process.env.NODE_ENV === 'development') {
          console.debug(`[useToolTracking] Tracked ${toolId}:`, {
            inputSize,
            outputSize,
            success,
          });
        }
      } catch (error) {
        // Silent fail - don't break tool functionality
        if (process.env.NODE_ENV === 'development') {
          console.error('[useToolTracking] Error:', error);
        }
      }
    },
    [toolId]
  );

  /**
   * Track tool error
   * Call this when your tool encounters an error
   */
  const trackError = useCallback(
    (error: Error | string, inputSize?: number) => {
      try {
        const manager = getUmamiAdapter();
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorType = typeof error === 'string' ? 'Error' : error.name;

        const event = EventNormalizer.enrichEvent({
          event: 'tool.error' as const,
          tool: toolId,
          errorType,
          errorMessage: EventNormalizer.truncate(errorMessage, 200),
          inputSize,
          sessionId: '',
        });

        manager.track(event);

        if (process.env.NODE_ENV === 'development') {
          console.debug(
            `[useToolTracking] Tracked error for ${toolId}:`,
            errorType
          );
        }
      } catch (err) {
        // Silent fail
        if (process.env.NODE_ENV === 'development') {
          console.error('[useToolTracking] Error tracking error:', err);
        }
      }
    },
    [toolId]
  );

  /**
   * Track with custom event data
   * For special cases where you need full control
   */
  const trackCustom = useCallback(
    (eventData: Partial<ToolUseEvent>) => {
      try {
        const manager = getUmamiAdapter();
        const session = getUmamiSessionTracker();

        const event = EventNormalizer.enrichEvent({
          event: 'tool.use',
          tool: toolId,
          success: true,
          sessionId: '',
          ...eventData,
        });

        manager.track(event);
        session?.addToolUsed(toolId);
        session?.incrementEvent();

        if (process.env.NODE_ENV === 'development') {
          console.debug(`[useToolTracking] Custom track ${toolId}:`, eventData);
        }
      } catch (error) {
        // Silent fail
        if (process.env.NODE_ENV === 'development') {
          console.error('[useToolTracking] Error in custom track:', error);
        }
      }
    },
    [toolId]
  );

  return {
    trackUse,
    trackError,
    trackCustom,
  };
}

export default useToolTracking;
