export interface XmlFormatterOptions {
  indentSize?: number;
  preserveComments?: boolean;
  preserveCdata?: boolean;
  sortAttributes?: boolean;
  removeEmptyElements?: boolean;
  normalizeNamespaces?: boolean;
}

export interface XmlFormatterResult {
  success: boolean;
  formatted?: string;
  error?: string;
  lineCount?: number;
  characterCount?: number;
}

export interface XmlMinifyResult {
  success: boolean;
  minified?: string;
  error?: string;
  originalSize?: number;
  minifiedSize?: number;
  reduction?: number;
}

export interface XmlValidationError {
  line: number;
  column: number;
  message: string;
}

export interface XmlValidationResult {
  valid: boolean;
  errors: XmlValidationError[];
  warnings?: string[];
}

export interface XmlMetadata {
  elementCount: number;
  uniqueElements: string[];
  attributeCount: number;
  maxDepth: number;
  namespaces: string[];
  version?: string;
  encoding?: string;
  commentCount: number;
  cdataCount: number;
  hasDoctype?: boolean;
  rootElement?: string;
}

export interface XmlSearchResult {
  path: string;
  value: string;
  type: 'element' | 'attribute' | 'text';
}

export interface XPathResult {
  path: string;
  value: string;
  type: 'element' | 'attribute' | 'text' | 'number' | 'boolean' | 'string';
  nodeName?: string;
}

export interface XPathEvaluationResult {
  success: boolean;
  results: XPathResult[];
  error?: string;
  resultType?: string;
}

export interface XmlTreeNode {
  name: string;
  type: 'element' | 'text' | 'comment' | 'cdata' | 'processing-instruction';
  path: string;
  attributes: { name: string; value: string; namespace?: string }[];
  children: XmlTreeNode[];
  value?: string;
  namespace?: string;
  namespaceUri?: string;
}

export interface NamespaceStat {
  prefix: string;
  uri: string;
  isDefault: boolean;
  elementCount: number;
  attributeCount: number;
  sampleElements: string[];
}

export interface NamespaceStatsResult {
  success: boolean;
  namespaces: NamespaceStat[];
  error?: string;
}

export function formatXml(
  input: string,
  options: XmlFormatterOptions = {}
): XmlFormatterResult {
  try {
    if (!input || !input.trim()) {
      return { success: false, error: 'Input is required' };
    }

    const {
      indentSize = 2,
      preserveComments = true,
      sortAttributes = false,
    } = options;

    // Simple XML formatting using regex and string manipulation
    let xml = input.trim();

    // Remove extra whitespace between tags
    xml = xml.replace(/>\s*</g, '><');

    // Robust XML formatting approach
    let result = '';
    let indent = 0;
    const indentStr = ' '.repeat(indentSize);

    // Process the XML character by character
    let i = 0;
    while (i < xml.length) {
      if (xml[i] === '<') {
        // Find the end of this tag
        let tagEnd = xml.indexOf('>', i);
        if (tagEnd === -1) break;

        let tag = xml.substring(i, tagEnd + 1);

        // Handle special tags
        if (tag.startsWith('<?xml')) {
          result += tag + '\n';
          i = tagEnd + 1;
          continue;
        }

        if (tag.startsWith('<!--')) {
          if (preserveComments) {
            result += indentStr.repeat(indent) + tag + '\n';
          }
          i = tagEnd + 1;
          continue;
        }

        if (tag.includes('<![CDATA[')) {
          result += indentStr.repeat(indent) + tag + '\n';
          i = tagEnd + 1;
          continue;
        }

        // Handle closing tags
        if (tag.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          result += indentStr.repeat(indent) + tag + '\n';
          i = tagEnd + 1;
          continue;
        }

        // Handle self-closing tags
        if (tag.endsWith('/>')) {
          result += indentStr.repeat(indent) + tag + '\n';
          i = tagEnd + 1;
          continue;
        }

        // Handle opening tags
        result += indentStr.repeat(indent) + tag;
        i = tagEnd + 1;

        // Check what comes after this opening tag
        let nextTagStart = xml.indexOf('<', i);
        if (nextTagStart === -1) nextTagStart = xml.length;

        let content = xml.substring(i, nextTagStart).trim();

        if (content) {
          // This element has text content - make it inline
          result += content;
          i = nextTagStart;

          // Now find and add the closing tag
          if (i < xml.length && xml[i] === '<') {
            let closingTagEnd = xml.indexOf('>', i);
            if (closingTagEnd !== -1) {
              let closingTag = xml.substring(i, closingTagEnd + 1);
              result += closingTag + '\n';
              i = closingTagEnd + 1;
            }
          }
        } else {
          // This element has no immediate text content - it's a container
          result += '\n';
          indent++;
        }
      } else {
        // Skip non-tag content (should not happen after our preprocessing)
        i++;
      }
    }

    // Clean up extra newlines and use result instead of formatted
    const formatted = result.trim();
    const lineCount = formatted.split('\n').length;

    return {
      success: true,
      formatted,
      lineCount,
      characterCount: formatted.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function minifyXml(input: string): XmlMinifyResult {
  try {
    if (!input || !input.trim()) {
      return { success: false, error: 'Input is required' };
    }

    const originalSize = input.length;

    let minified = input.trim();

    // Remove whitespace between tags (but preserve CDATA and text content)
    minified = minified.replace(/>\s+</g, '><');

    // Remove comments unless they're in CDATA
    minified = minified.replace(/<!--[\s\S]*?-->/g, '');

    // Remove extra whitespace but preserve CDATA content
    minified = minified.replace(/(?<!<!\[CDATA\[.*)\s+(?!.*\]\]>)/g, ' ');

    // Remove whitespace around = in attributes
    minified = minified.replace(/\s*=\s*/g, '=');

    const minifiedSize = minified.length;
    const reduction =
      originalSize > 0
        ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
        : 0;

    return {
      success: true,
      minified,
      originalSize,
      minifiedSize,
      reduction,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function validateXml(input: string): XmlValidationResult {
  try {
    if (!input || !input.trim()) {
      return {
        valid: false,
        errors: [{ line: 1, column: 1, message: 'Input is empty' }],
      };
    }

    const errors: XmlValidationError[] = [];
    const lines = input.split('\n');

    // Simple XML validation using regex patterns
    let tagStack: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Find all tags in the line
      const tagMatches = line.match(/<[^>]+>/g) || [];

      for (const tag of tagMatches) {
        // Skip comments and CDATA
        if (
          tag.startsWith('<!--') ||
          tag.startsWith('<![CDATA[') ||
          tag.startsWith('<?')
        ) {
          continue;
        }

        // Self-closing tag
        if (tag.endsWith('/>')) {
          continue;
        }

        // Closing tag
        if (tag.startsWith('</')) {
          const tagName = tag.slice(2, -1).trim();
          const expectedTag = tagStack.pop();

          if (!expectedTag) {
            errors.push({
              line: lineNum,
              column: line.indexOf(tag) + 1,
              message: `Unexpected closing tag: ${tag}`,
            });
          } else if (expectedTag !== tagName) {
            errors.push({
              line: lineNum,
              column: line.indexOf(tag) + 1,
              message: `Tag mismatch: expected </${expectedTag}> but found </${tagName}>`,
            });
          }
          continue;
        }

        // Opening tag
        const tagName = tag.slice(1, -1).split(/\s/)[0];
        tagStack.push(tagName);

        // Check for unquoted attributes (simple check)
        if (/\s+\w+=\w/.test(tag)) {
          errors.push({
            line: lineNum,
            column: line.indexOf(tag) + 1,
            message: `Unquoted attribute value in tag: ${tag}`,
          });
        }

        // Check for undefined namespace prefixes
        const colonMatch = tagName.match(/([^:]+):(.+)/);
        if (colonMatch && !input.includes(`xmlns:${colonMatch[1]}`)) {
          errors.push({
            line: lineNum,
            column: line.indexOf(tag) + 1,
            message: `Undefined namespace prefix: ${colonMatch[1]}`,
          });
        }
      }
    }

    // Check for unclosed tags
    for (const unclosedTag of tagStack) {
      errors.push({
        line: 1,
        column: 1,
        message: `Unclosed tag: <${unclosedTag}>`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      ],
    };
  }
}

export function parseXmlMetadata(input: string): XmlMetadata {
  const metadata: XmlMetadata = {
    elementCount: 0,
    uniqueElements: [],
    attributeCount: 0,
    maxDepth: 0,
    namespaces: [],
    commentCount: 0,
    cdataCount: 0,
  };

  try {
    if (!input || !input.trim()) {
      return metadata;
    }

    const uniqueElementsSet = new Set<string>();
    let currentDepth = 0;
    let maxDepth = 0;

    // Process each tag
    const allTags = input.match(/<[^>]+>/g) || [];

    for (const tag of allTags) {
      // Skip comments, CDATA, and processing instructions
      if (
        tag.startsWith('<!--') ||
        tag.startsWith('<![CDATA[') ||
        tag.startsWith('<?')
      ) {
        continue;
      }

      // Self-closing tag
      if (tag.endsWith('/>')) {
        const tagName = tag.slice(1, -2).split(/\s/)[0];
        if (tagName) {
          uniqueElementsSet.add(tagName);
          metadata.elementCount++;
          maxDepth = Math.max(maxDepth, currentDepth + 1);
        }

        // Count attributes
        const attrMatches = tag.match(/\s+\w+\s*=\s*["'][^"']*["']/g) || [];
        metadata.attributeCount += attrMatches.length;
        continue;
      }

      // Closing tag
      if (tag.startsWith('</')) {
        currentDepth = Math.max(0, currentDepth - 1);
        continue;
      }

      // Opening tag
      const tagName = tag.slice(1, -1).split(/\s/)[0];
      if (tagName) {
        uniqueElementsSet.add(tagName);
        metadata.elementCount++;
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }

      // Count attributes
      const attrMatches = tag.match(/\s+\w+\s*=\s*["'][^"']*["']/g) || [];
      metadata.attributeCount += attrMatches.length;

      // Extract namespaces
      const nsMatches = tag.match(/xmlns:(\w+)/g) || [];
      for (const nsMatch of nsMatches) {
        const nsPrefix = nsMatch.replace('xmlns:', '');
        if (!metadata.namespaces.includes(nsPrefix)) {
          metadata.namespaces.push(nsPrefix);
        }
      }
    }

    metadata.uniqueElements = Array.from(uniqueElementsSet);
    metadata.maxDepth = maxDepth;

    // Extract XML declaration info
    const xmlDeclaration = input.match(/<\?xml[^>]*\?>/i);
    if (xmlDeclaration) {
      const versionMatch = xmlDeclaration[0].match(/version=["']([^"']*)["']/i);
      const encodingMatch = xmlDeclaration[0].match(
        /encoding=["']([^"']*)["']/i
      );

      if (versionMatch) metadata.version = versionMatch[1];
      if (encodingMatch) metadata.encoding = encodingMatch[1];
    }

    // Count comments and CDATA
    metadata.commentCount = (input.match(/<!--[\s\S]*?-->/g) || []).length;
    metadata.cdataCount = (
      input.match(/<!\[CDATA\[[\s\S]*?\]\]>/g) || []
    ).length;

    // Set root element
    const rootMatch = input.match(/<([^/!?][^>\s]*)/);
    if (rootMatch) {
      metadata.rootElement = rootMatch[1];
    }

    return metadata;
  } catch (error) {
    return metadata;
  }
}

export function searchXmlElements(
  input: string,
  query: string
): XmlSearchResult[] {
  const results: XmlSearchResult[] = [];

  try {
    if (!input || !input.trim() || !query) {
      return results;
    }

    // Search for attributes with @ prefix
    if (query.startsWith('@')) {
      const attrName = query.substring(1);
      const attrRegex = new RegExp(
        `${attrName}\\s*=\\s*["']([^"']*)["']`,
        'gi'
      );

      let match;
      while ((match = attrRegex.exec(input)) !== null) {
        results.push({
          path: `@${attrName}`,
          value: match[1],
          type: 'attribute',
        });
      }
      return results;
    }

    // Handle XPath-style searches like //user/@name
    const xpathAttrMatch = query.match(/\/\/([^/]+)\/@(\w+)/);
    if (xpathAttrMatch) {
      const [, elementName, attrName] = xpathAttrMatch;
      const elementRegex = new RegExp(
        `<${elementName}[^>]*${attrName}\\s*=\\s*["']([^"']*)["'][^>]*>`,
        'gi'
      );

      let match;
      while ((match = elementRegex.exec(input)) !== null) {
        results.push({
          path: `//${elementName}/@${attrName}`,
          value: match[1],
          type: 'attribute',
        });
      }
      return results;
    }

    // Search for elements by name
    let searchTerm = query;
    if (query.startsWith('//')) {
      searchTerm = query.substring(2);
    }

    // Find all occurrences of the element and extract full XML blocks
    const elementRegex = new RegExp(
      `<${searchTerm}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${searchTerm}>)`,
      'gi'
    );
    let match;
    let matchCount = 0;

    while ((match = elementRegex.exec(input)) !== null) {
      matchCount++;
      const fullMatch = match[0];

      // Format the found XML block manually to avoid recursion
      let xmlBlock = fullMatch;
      try {
        // Simple formatting without calling formatXml to avoid recursion
        xmlBlock = fullMatch.replace(/></g, '>\\n<').replace(/^/gm, '  ');
      } catch (e) {
        // Use original if formatting fails
      }

      const path = query.startsWith('//')
        ? `//${searchTerm}`
        : `/${searchTerm}`;
      results.push({
        path: matchCount === 1 ? path : `${path}[${matchCount}]`,
        value: xmlBlock,
        type: 'element',
      });
    }

    // Also try simple tag matching for elements that might not have been caught
    if (results.length === 0) {
      const simpleRegex = new RegExp(`<${searchTerm}[^>]*>`, 'gi');
      let simpleMatch;
      let simpleCount = 0;

      while ((simpleMatch = simpleRegex.exec(input)) !== null) {
        simpleCount++;

        // Try to find the complete element including closing tag
        let elementContent = simpleMatch[0];
        if (!elementContent.endsWith('/>')) {
          const remainingInput = input.substring(simpleMatch.index);
          const closingMatch = remainingInput.match(
            new RegExp(`<${searchTerm}[^>]*>([\\s\\S]*?)</${searchTerm}>`, 'i')
          );
          if (closingMatch) {
            elementContent = closingMatch[0];
            // Format it manually to avoid recursion
            try {
              elementContent = elementContent
                .replace(/></g, '>\\n<')
                .replace(/^/gm, '  ');
            } catch (e) {
              // Use original if formatting fails
            }
          }
        }

        const path = query.startsWith('//')
          ? `//${searchTerm}`
          : `/${searchTerm}`;
        results.push({
          path: simpleCount === 1 ? path : `${path}[${simpleCount}]`,
          value: elementContent,
          type: 'element',
        });
      }
    }

    // Also search for self-closing tags
    const selfClosingRegex = new RegExp(`<${searchTerm}[^>]*/>`, 'gi');
    while ((match = selfClosingRegex.exec(input)) !== null) {
      matchCount++;
      const path = query.startsWith('//')
        ? `//${searchTerm}[${matchCount}]`
        : `/${searchTerm}[${matchCount}]`;
      results.push({
        path,
        value: '',
        type: 'element',
      });
    }

    return results;
  } catch (error) {
    return results;
  }
}

function buildNodePath(node: Node, root: Node): string {
  const segments: string[] = [];
  let current: Node | null = node;

  while (current && current !== root && current.parentNode) {
    if (current.nodeType === 1 /* ELEMENT_NODE */) {
      const el = current as Element;
      const parent = current.parentNode as Element;
      const siblings = Array.from(parent.childNodes).filter(
        (n) => n.nodeType === 1 && (n as Element).nodeName === el.nodeName
      );
      const index = siblings.indexOf(el) + 1;
      const segment =
        siblings.length > 1 ? `${el.nodeName}[${index}]` : el.nodeName;
      segments.unshift(segment);
    } else if (current.nodeType === 2 /* ATTRIBUTE_NODE */) {
      segments.unshift(`@${(current as Attr).name}`);
    } else if (current.nodeType === 3 /* TEXT_NODE */) {
      segments.unshift('text()');
    }
    current = current.parentNode;
  }

  if (root.nodeType === 1) {
    segments.unshift((root as Element).nodeName);
  }

  return '/' + segments.join('/');
}

function collectNamespaceDeclarations(
  xml: string
): { prefix: string; uri: string; isDefault: boolean }[] {
  const declarations: { prefix: string; uri: string; isDefault: boolean }[] = [];
  const seen = new Set<string>();
  const regex = /xmlns(?::([\w.-]+))?\s*=\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const prefix = match[1] ?? '';
    const uri = match[2];
    const key = `${prefix}|${uri}`;
    if (seen.has(key)) continue;
    seen.add(key);
    declarations.push({ prefix, uri, isDefault: prefix === '' });
  }
  return declarations;
}

function parseXmlDocument(input: string): Document | { error: string } {
  if (typeof DOMParser === 'undefined') {
    return { error: 'DOMParser not available in this environment' };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'application/xml');
  const errorNode = doc.getElementsByTagName('parsererror')[0];
  if (errorNode) {
    return { error: errorNode.textContent ?? 'Invalid XML' };
  }
  return doc;
}

export function evaluateXPath(
  input: string,
  expression: string
): XPathEvaluationResult {
  if (!input || !input.trim()) {
    return { success: false, results: [], error: 'XML input is required' };
  }
  if (!expression || !expression.trim()) {
    return { success: false, results: [], error: 'XPath expression is required' };
  }

  const parsed = parseXmlDocument(input);
  if ('error' in parsed) {
    return { success: false, results: [], error: parsed.error };
  }

  const doc = parsed;
  const declarations = collectNamespaceDeclarations(input);
  const nsMap = new Map<string, string>();
  for (const d of declarations) {
    if (d.prefix) nsMap.set(d.prefix, d.uri);
  }
  const resolver = (prefix: string | null): string | null =>
    prefix ? nsMap.get(prefix) ?? null : null;

  try {
    const xpathResult = doc.evaluate(
      expression,
      doc,
      resolver,
      0 /* ANY_TYPE */,
      null
    );

    const results: XPathResult[] = [];
    let resultTypeLabel = 'unknown';

    switch (xpathResult.resultType) {
      case 1 /* NUMBER_TYPE */:
        resultTypeLabel = 'number';
        results.push({
          path: expression,
          value: String(xpathResult.numberValue),
          type: 'number',
        });
        break;
      case 2 /* STRING_TYPE */:
        resultTypeLabel = 'string';
        results.push({
          path: expression,
          value: xpathResult.stringValue,
          type: 'string',
        });
        break;
      case 3 /* BOOLEAN_TYPE */:
        resultTypeLabel = 'boolean';
        results.push({
          path: expression,
          value: String(xpathResult.booleanValue),
          type: 'boolean',
        });
        break;
      case 4 /* UNORDERED_NODE_ITERATOR_TYPE */:
      case 5 /* ORDERED_NODE_ITERATOR_TYPE */: {
        resultTypeLabel = 'node-set';
        let node = xpathResult.iterateNext();
        while (node) {
          const path = buildNodePath(node, doc);
          if (node.nodeType === 1) {
            results.push({
              path,
              value: (node as Element).outerHTML ?? node.nodeName,
              type: 'element',
              nodeName: node.nodeName,
            });
          } else if (node.nodeType === 2) {
            results.push({
              path,
              value: (node as Attr).value,
              type: 'attribute',
              nodeName: (node as Attr).name,
            });
          } else {
            results.push({
              path,
              value: node.nodeValue ?? '',
              type: 'text',
            });
          }
          node = xpathResult.iterateNext();
        }
        break;
      }
      default:
        resultTypeLabel = 'other';
    }

    return { success: true, results, resultType: resultTypeLabel };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Invalid XPath expression',
    };
  }
}

export function buildXmlTree(input: string): {
  success: boolean;
  tree?: XmlTreeNode;
  error?: string;
} {
  if (!input || !input.trim()) {
    return { success: false, error: 'XML input is required' };
  }

  const parsed = parseXmlDocument(input);
  if ('error' in parsed) {
    return { success: false, error: parsed.error };
  }

  const root = parsed.documentElement;
  if (!root) {
    return { success: false, error: 'No root element found' };
  }

  function convert(node: Node, parentPath: string, siblingIndex?: number): XmlTreeNode | null {
    if (node.nodeType === 1) {
      const el = node as Element;
      const name = el.nodeName;
      const path =
        siblingIndex !== undefined && siblingIndex > 0
          ? `${parentPath}/${name}[${siblingIndex + 1}]`
          : `${parentPath}/${name}`;

      const attributes = Array.from(el.attributes).map((attr) => ({
        name: attr.name,
        value: attr.value,
        namespace: attr.namespaceURI ?? undefined,
      }));

      const childrenByName = new Map<string, number>();
      const children: XmlTreeNode[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === 1) {
          const childName = (child as Element).nodeName;
          const count = childrenByName.get(childName) ?? 0;
          const totalSameName = Array.from(el.childNodes).filter(
            (n) => n.nodeType === 1 && (n as Element).nodeName === childName
          ).length;
          const idx = totalSameName > 1 ? count : undefined;
          const converted = convert(child, path, idx);
          if (converted) children.push(converted);
          childrenByName.set(childName, count + 1);
        } else if (child.nodeType === 3) {
          const text = (child.nodeValue ?? '').trim();
          if (text) {
            children.push({
              name: '#text',
              type: 'text',
              path: `${path}/text()`,
              attributes: [],
              children: [],
              value: text,
            });
          }
        } else if (child.nodeType === 8) {
          children.push({
            name: '#comment',
            type: 'comment',
            path: `${path}/comment()`,
            attributes: [],
            children: [],
            value: child.nodeValue ?? '',
          });
        } else if (child.nodeType === 4) {
          children.push({
            name: '#cdata',
            type: 'cdata',
            path: `${path}/cdata()`,
            attributes: [],
            children: [],
            value: child.nodeValue ?? '',
          });
        } else if (child.nodeType === 7) {
          children.push({
            name: (child as ProcessingInstruction).target,
            type: 'processing-instruction',
            path,
            attributes: [],
            children: [],
            value: child.nodeValue ?? '',
          });
        }
      }

      return {
        name,
        type: 'element',
        path,
        attributes,
        children,
        namespace: el.prefix ?? undefined,
        namespaceUri: el.namespaceURI ?? undefined,
      };
    }
    return null;
  }

  const tree = convert(root, '');
  if (!tree) {
    return { success: false, error: 'Failed to build tree' };
  }
  return { success: true, tree };
}

export function getNamespaceStats(input: string): NamespaceStatsResult {
  if (!input || !input.trim()) {
    return { success: false, namespaces: [], error: 'XML input is required' };
  }

  const parsed = parseXmlDocument(input);
  if ('error' in parsed) {
    return { success: false, namespaces: [], error: parsed.error };
  }

  const declarations = collectNamespaceDeclarations(input);
  const stats = new Map<string, NamespaceStat>();
  for (const d of declarations) {
    const key = d.uri;
    if (!stats.has(key)) {
      stats.set(key, {
        prefix: d.prefix,
        uri: d.uri,
        isDefault: d.isDefault,
        elementCount: 0,
        attributeCount: 0,
        sampleElements: [],
      });
    }
  }

  const walk = (node: Node) => {
    if (node.nodeType === 1) {
      const el = node as Element;
      const uri = el.namespaceURI ?? '';
      if (uri && stats.has(uri)) {
        const stat = stats.get(uri)!;
        stat.elementCount += 1;
        if (
          stat.sampleElements.length < 5 &&
          !stat.sampleElements.includes(el.nodeName)
        ) {
          stat.sampleElements.push(el.nodeName);
        }
      }
      for (const attr of Array.from(el.attributes)) {
        const attrUri = attr.namespaceURI ?? '';
        if (attrUri && stats.has(attrUri)) {
          stats.get(attrUri)!.attributeCount += 1;
        }
      }
      for (const child of Array.from(el.childNodes)) walk(child);
    }
  };

  if (parsed.documentElement) walk(parsed.documentElement);

  return {
    success: true,
    namespaces: Array.from(stats.values()).sort((a, b) =>
      a.isDefault ? -1 : b.isDefault ? 1 : a.prefix.localeCompare(b.prefix)
    ),
  };
}

// Sample XML data for testing and examples
export const sampleXmlData = {
  simple: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <child>content</child>
</root>`,

  complex: `<?xml version="1.0" encoding="UTF-8"?>
<users xmlns:custom="http://example.com">
  <user id="1" name="Alice">
    <email>alice@example.com</email>
    <profile custom:type="premium">
      <settings>
        <theme>dark</theme>
        <notifications enabled="true"/>
      </settings>
    </profile>
  </user>
  <user id="2" name="Bob">
    <email>bob@example.com</email>
    <profile custom:type="basic"/>
  </user>
</users>`,

  rss: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com</link>
    <description>A sample RSS feed</description>
    <item>
      <title>First Post</title>
      <link>https://example.com/first-post</link>
      <description><![CDATA[This is the <em>first</em> post content.]]></description>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`,

  svg: `<svg xmlns="https://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="#ff6b6b" rx="5"/>
  <circle cx="50" cy="50" r="30" fill="#4ecdc4" opacity="0.7"/>
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Hello</text>
</svg>`,

  soap: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://example.com/webservice">
  <soap:Header>
    <web:Authentication>
      <web:Token>abc123</web:Token>
    </web:Authentication>
  </soap:Header>
  <soap:Body>
    <web:GetUser>
      <web:Id>12345</web:Id>
    </web:GetUser>
  </soap:Body>
</soap:Envelope>`,

  config: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <database>
    <host>localhost</host>
    <port>5432</port>
    <name>myapp</name>
    <credentials encrypted="true">
      <username>admin</username>
      <password>********</password>
    </credentials>
  </database>
  <features>
    <feature name="logging" enabled="true"/>
    <feature name="cache" enabled="false"/>
    <feature name="analytics" enabled="true"/>
  </features>
  <settings>
    <timeout>30</timeout>
    <retry-count>3</retry-count>
    <debug-mode>false</debug-mode>
  </settings>
</configuration>`,
};
