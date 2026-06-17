'use client';

import CurlToCodeConverter from './CurlToCode';

/**
 * curl-to-php landing page variant. Thin wrapper that boots the shared
 * CurlToCode UI with PHP + Guzzle pre-selected. Analytics events flow
 * under the `curl-to-php` tool id so Umami segments traffic per landing.
 *
 * See RIC-114 and the RIC-112 epic for the full curl-to-code v2 plan.
 */
export default function CurlToPhp({ dictionary }: { dictionary?: any } = {}) {
  return (
    <CurlToCodeConverter
      toolId="curl-to-php"
      defaultLanguage="php"
      defaultFramework="guzzle"
      dictionary={dictionary}
    />
  );
}
