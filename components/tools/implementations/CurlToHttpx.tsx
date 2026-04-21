'use client';

import CurlToCodeConverter from './CurlToCode';

/**
 * curl-to-httpx landing. Pre-selects Python + httpx. See RIC-116.
 */
export default function CurlToHttpx() {
  return (
    <CurlToCodeConverter
      toolId="curl-to-httpx"
      defaultLanguage="python"
      defaultFramework="httpx"
    />
  );
}
