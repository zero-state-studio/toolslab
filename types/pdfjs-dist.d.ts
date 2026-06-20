// The explicit ESM subpath import (forced for correct bundling under Next)
// has no bundled types; reuse the package's main type declarations.
declare module 'pdfjs-dist/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
