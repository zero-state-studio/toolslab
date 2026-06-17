'use client';

import CurlToCodeConverter from './CurlToCode';

/** curl-to-csharp landing. Defaults to C# HttpClient. RIC-117. */
export default function CurlToCsharp({ dictionary }: { dictionary?: any } = {}) {
  return (
    <CurlToCodeConverter
      toolId="curl-to-csharp"
      defaultLanguage="csharp"
      defaultFramework="httpclient"
      dictionary={dictionary}
    />
  );
}
