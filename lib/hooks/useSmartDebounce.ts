import { useEffect, useRef, useState } from 'react';

interface UseSmartDebounceOptions {
  /**
   * Base delay in milliseconds
   * @default 300
   */
  delay?: number;

  /**
   * Maximum wait time in milliseconds
   * Ensures callback is called at least once every maxWait ms
   * @default 1000
   */
  maxWait?: number;

  /**
   * Adaptive delay based on input size
   * - Input <100 chars: 0ms (immediate)
   * - Input 100-1000 chars: delay ms
   * - Input >1000 chars: delay * 1.5 ms
   * @default true
   */
  adaptive?: boolean;
}

/**
 * Smart debounce hook with adaptive delay based on input size
 *
 * @example
 * ```typescript
 * const [input, setInput] = useState('');
 * const debouncedInput = useSmartDebounce(input, { delay: 300, maxWait: 1000 });
 *
 * useEffect(() => {
 *   if (!debouncedInput) return;
 *   const result = processToolData(debouncedInput);
 *   setOutput(result);
 * }, [debouncedInput]);
 * ```
 */
export function useSmartDebounce<T>(
  value: T,
  options: UseSmartDebounceOptions = {}
): T {
  const { delay = 300, maxWait = 1000, adaptive = true } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    // Calculate adaptive delay based on input size
    let effectiveDelay = delay;

    if (adaptive && typeof value === 'string') {
      const length = value.length;
      if (length < 100) {
        effectiveDelay = 0; // Immediate for short inputs
      } else if (length > 1000) {
        effectiveDelay = delay * 1.5; // Longer delay for large inputs
      }
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastUpdateRef.current = Date.now();

      // Clear maxWait timeout since we've updated
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = undefined;
      }
    }, effectiveDelay);

    // Set up maxWait timeout if not already set
    if (!maxWaitTimeoutRef.current && maxWait > 0) {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      const remainingMaxWait = Math.max(0, maxWait - timeSinceLastUpdate);

      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastUpdateRef.current = Date.now();
        maxWaitTimeoutRef.current = undefined;
      }, remainingMaxWait);
    }

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, [value, delay, maxWait, adaptive]);

  return debouncedValue;
}

/**
 * Simple debounce hook without adaptive behavior
 *
 * @example
 * ```typescript
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  return useSmartDebounce(value, { delay, adaptive: false, maxWait: 0 });
}
