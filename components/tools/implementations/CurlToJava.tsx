'use client';

import CurlToCodeConverter from './CurlToCode';

/** curl-to-java landing. Defaults to Java 11+ HttpClient. RIC-117. */
export default function CurlToJava() {
  return (
    <CurlToCodeConverter
      toolId="curl-to-java"
      defaultLanguage="java"
      defaultFramework="httpurlconnection"
    />
  );
}
