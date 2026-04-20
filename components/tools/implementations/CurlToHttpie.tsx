'use client';

import CurlToCodeConverter from './CurlToCode';

/** curl-to-httpie landing. Defaults to Shell + HTTPie. RIC-118. */
export default function CurlToHttpie() {
  return (
    <CurlToCodeConverter
      toolId="curl-to-httpie"
      defaultLanguage="shell"
      defaultFramework="httpie"
    />
  );
}
