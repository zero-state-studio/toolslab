'use client';

import CurlToCodeConverter from './CurlToCode';

/**
 * curl-to-axios landing. Pre-selects JavaScript + axios. See RIC-116.
 */
export default function CurlToAxios({ dictionary }: { dictionary?: any } = {}) {
  return (
    <CurlToCodeConverter
      toolId="curl-to-axios"
      defaultLanguage="javascript"
      defaultFramework="axios"
      dictionary={dictionary}
    />
  );
}
