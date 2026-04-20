'use client';

import CurlToCodeConverter from './CurlToCode';

/** curl-to-ruby landing. Defaults to Ruby + Net::HTTP. RIC-118. */
export default function CurlToRuby() {
  return (
    <CurlToCodeConverter
      toolId="curl-to-ruby"
      defaultLanguage="ruby"
      defaultFramework="net-http"
    />
  );
}
