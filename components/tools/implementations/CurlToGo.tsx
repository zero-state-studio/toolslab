'use client';

import CurlToCodeConverter from './CurlToCode';

/**
 * curl-to-go landing page variant. Pre-selects Go + net/http as the
 * most common stdlib target. See RIC-115 and the RIC-112 epic.
 */
export default function CurlToGo() {
  return (
    <CurlToCodeConverter
      toolId="curl-to-go"
      defaultLanguage="go"
      defaultFramework="net-http"
    />
  );
}
