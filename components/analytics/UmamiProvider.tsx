'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import Script from 'next/script';

interface UmamiContextType {
  track: (event: string, data?: any) => void;
  trackToolUse: (tool: string, action: string, metadata?: any) => void;
  trackFavorite: (id: string, type: string, isFavorited: boolean) => void;
  trackSocial: (platform: string, from?: string) => void;
  trackEngagement: (action: string, metadata?: any) => void;
  trackConversion: (type: string, value?: number | string) => void;
  isEnabled: boolean;
}

const UmamiContext = createContext<UmamiContextType | null>(null);

interface UmamiProviderProps {
  children: ReactNode;
}

export function UmamiProvider({ children }: UmamiProviderProps) {
  const scriptLoaded = useRef(false);
  const [shouldLoadScript, setShouldLoadScript] = useState(false);

  // Get config from environment
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ||
    (process.env.NEXT_PUBLIC_UMAMI_HOST_URL
      ? `${process.env.NEXT_PUBLIC_UMAMI_HOST_URL}/script.js`
      : null);

  // Tag for environment filtering in Umami dashboard (prod vs preview)
  const envTag =
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    'unknown';

  // Decide client-side whether to inject the script (avoid SSR mismatch)
  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local');

    const isEnabled =
      !isLocalhost &&
      (process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_UMAMI_DEBUG === 'true');

    console.log('🔍 Umami Init:', {
      enabled: isEnabled,
      isLocalhost,
      hostname,
      websiteId: websiteId ? 'SET' : 'MISSING',
      scriptUrl: scriptUrl || 'MISSING',
      nodeEnv: process.env.NODE_ENV,
      debug: process.env.NEXT_PUBLIC_UMAMI_DEBUG,
      envTag,
    });

    if (isLocalhost) {
      console.log('🚫 Umami blocked - localhost detected');
      return;
    }
    if (!isEnabled || !websiteId || !scriptUrl) {
      console.warn('⚠️ Umami not loaded - missing config');
      return;
    }

    setShouldLoadScript(true);
  }, [websiteId, scriptUrl, envTag]);

  const shouldTrack = (): boolean => {
    return (
      shouldLoadScript &&
      scriptLoaded.current &&
      typeof window !== 'undefined' &&
      typeof (window as any).umami !== 'undefined'
    );
  };

  const track = (event: string, data?: any) => {
    if (!shouldTrack()) {
      console.debug('🔇 Umami tracking skipped:', event, data);
      return;
    }

    try {
      (window as any).umami.track(event, data);
      console.log('📊 Umami tracked:', event, data);
    } catch (error) {
      console.error('❌ Umami tracking error:', error);
    }
  };

  const trackToolUse = (tool: string, action: string, metadata?: any) => {
    track('tool-use', {
      tool,
      action,
      success: true,
      timestamp: Date.now(),
      ...metadata,
    });
  };

  const trackFavorite = (id: string, type: string, isFavorited: boolean) => {
    track(isFavorited ? `${type}-favorited` : `${type}-unfavorited`, {
      [`${type}_id`]: id,
      timestamp: Date.now(),
    });
  };

  const trackSocial = (platform: string, from?: string) => {
    track(`social-${platform}-clicked`, {
      from: from || 'unknown',
      timestamp: Date.now(),
    });
  };

  const trackEngagement = (action: string, metadata?: any) => {
    track('engagement', {
      action,
      timestamp: Date.now(),
      ...metadata,
    });
  };

  const trackConversion = (type: string, value?: number | string) => {
    track('conversion', {
      type,
      value,
      timestamp: Date.now(),
    });
  };

  const contextValue: UmamiContextType = {
    track,
    trackToolUse,
    trackFavorite,
    trackSocial,
    trackEngagement,
    trackConversion,
    isEnabled: shouldTrack(),
  };

  return (
    <UmamiContext.Provider value={contextValue}>
      {shouldLoadScript && websiteId && scriptUrl && (
        <Script
          src={scriptUrl}
          strategy="afterInteractive"
          data-website-id={websiteId}
          data-auto-track="false"
          data-performance="true"
          data-tag={envTag}
          onLoad={() => {
            scriptLoaded.current = true;
            console.log('✅ Umami loaded (next/script)');
            if (typeof (window as any).umami === 'undefined') {
              console.error('❌ Umami object missing after onLoad');
            }
          }}
          onError={(e) => {
            console.error('❌ Umami script failed to load', e);
          }}
        />
      )}
      {children}
    </UmamiContext.Provider>
  );
}

export function useUmami(): UmamiContextType {
  const context = useContext(UmamiContext);

  if (!context) {
    // Return no-op functions if context not available
    return {
      track: () => {},
      trackToolUse: () => {},
      trackFavorite: () => {},
      trackSocial: () => {},
      trackEngagement: () => {},
      trackConversion: () => {},
      isEnabled: false,
    };
  }

  return context;
}
