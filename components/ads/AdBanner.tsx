'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const ADS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
// Show grey placeholders in dev so ad positions are visible without real ads.
const SHOW_PLACEHOLDER =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ADS_PLACEHOLDER === 'true';

interface AdBannerProps {
  /** AdSense ad unit slot ID. Defaults to the tool-page slot. */
  slot?: string;
  /** AdSense format. 'auto' = responsive. */
  format?: string;
  /** Whether the unit is full-width responsive. */
  responsive?: boolean;
  /** Min height reserved to avoid CLS (px). */
  minHeight?: number;
  /** Max height cap (px). Constrains tall responsive units (e.g. content banner). */
  maxHeight?: number;
  /** Fixed-size unit (px). When set, renders a fixed `inline-block` ins with no
   *  data-ad-format / data-full-width-responsive — matches AdSense fixed units (e.g. 728x90). */
  fixedWidth?: number;
  fixedHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Google AdSense banner.
 *
 * Renders nothing unless `NEXT_PUBLIC_ENABLE_ADS=true` and a publisher ID is set
 * (production builds via `npm run build:prod`). Reserves vertical space to avoid
 * layout shift (CLS). Consent is handled upstream by Google CMP — the AdSense
 * script (loaded in app/layout.tsx) gates personalized ads on the user's choice.
 */
export default function AdBanner({
  slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL,
  format = 'auto',
  responsive = true,
  minHeight = 90,
  maxHeight,
  fixedWidth,
  fixedHeight,
  className = '',
  style,
}: AdBannerProps) {
  const isFixed = fixedWidth != null && fixedHeight != null;
  const [mounted, setMounted] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || pushedRef.current) return;
    if (!ADS_ENABLED || !ADSENSE_CLIENT || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // AdSense script not ready yet — the push queue handles it.
    }
  }, [mounted, slot]);

  // Dev placeholder: visible grey box to preview ad positions locally.
  if (SHOW_PLACEHOLDER) {
    return (
      <div
        className={`ad-banner flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-100 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500 ${className}`}
        style={{ minHeight, maxHeight, ...style }}
      >
        Ad · {slot || 'no-slot'}
      </div>
    );
  }

  // Off in dev / missing config: render nothing, no reserved space.
  if (!ADS_ENABLED || !ADSENSE_CLIENT || !slot) return null;

  return (
    <div
      className={`ad-banner overflow-hidden ${className}`}
      style={{ minHeight, maxHeight, ...style }}
      aria-hidden="true"
    >
      {/* Reserve space before mount to prevent CLS */}
      {mounted &&
        (isFixed ? (
          <ins
            className="adsbygoogle"
            style={{
              display: 'inline-block',
              width: fixedWidth,
              height: fixedHeight,
            }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
          />
        ) : (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight, maxHeight }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        ))}
    </div>
  );
}
