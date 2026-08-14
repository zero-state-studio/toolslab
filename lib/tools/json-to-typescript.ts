// JSON to TypeScript Converter - Core Logic
// Intelligent type inference and TypeScript interface generation

import { pythonToJson } from './json-formatter';
import { buildSchemaDocument } from './json-schema-generator';

// Type definitions for configuration
export interface JsonToTypeScriptOptions {
  // Naming conventions
  namingStrategy: 'PascalCase' | 'camelCase' | 'snake_case' | 'preserve';
  rootInterfaceName: string;

  // Type generation preferences
  useInterfaces: boolean; // true for interface, false for type alias
  arrayNotation: 'array' | 'generic'; // T[] vs Array<T>

  // New options for proper handling
  dateHandling: 'string' | 'Date' | 'string-with-comment';
  nullHandling: 'union' | 'optional'; // string | null vs string?
  optionalHandling: 'loose' | 'strict'; // loose (null | undefined) vs strict (null only)
  exportStyle: 'export' | 'declare' | 'none';
  separateInterfaces: boolean; // If false, inline everything

  // Advanced features
  extractNestedTypes: boolean;
  enableReadonly: boolean;
  detectEnums: boolean;
  inferDates: boolean; // For backward compatibility
  enableStringLiterals: boolean;
  maxDepth: number;

  // Output options
  includeComments: boolean;
  includeExports: boolean; // For backward compatibility
  sortProperties: boolean;
  indentSize: number;
  indentType: 'spaces' | 'tabs';

  // Additional schemas
  generateZodSchema: boolean;
  generateJsonSchema: boolean;
  generateValidationCode: boolean;
}

export interface TypeScriptGenerationResult {
  success: boolean;
  error?: string;

  // Generated code
  interfaces: string;
  zodSchema?: string;
  jsonSchema?: string;
  validationCode?: string;

  // Analysis information
  detectedTypes: DetectedType[];
  circularReferences: string[];
  warnings: string[];
  stats: {
    interfaceCount: number;
    propertyCount: number;
    depth: number;
    processingTime: number;
  };
}

export interface DetectedType {
  name: string;
  type: string;
  path: string;
  isOptional: boolean;
  isArray: boolean;
  description?: string;
  examples?: any[];
}

// Internal type analysis structures
interface TypeInfo {
  type: string;
  isOptional: boolean;
  isArray: boolean;
  enumValues?: string[];
  children?: Record<string, TypeInfo>;
  examples?: any[];
  interfaceName?: string; // Clean interface name for objects
}

interface ProcessingContext {
  types: Map<string, TypeInfo>;
  dependencies: Set<string>;
  circularRefs: Set<string>;
  nameGenerator: InterfaceNameGenerator;
  depth: number;
  options: JsonToTypeScriptOptions;
}

// Interface name generator with proper algorithm and conflict resolver
class InterfaceNameGenerator {
  private usedNames = new Set<string>();
  private nameResolver = new InterfaceNameResolver();

  generateInterfaceName(
    path: string[],
    currentKey: string,
    parentKey?: string,
    isArrayItem: boolean = false
  ): string {
    let baseName: string;

    // CASO 1: Root object
    if (path.length === 0) {
      baseName = 'RootObject'; // Default, can be customized
    }
    // CASO 2: Oggetto dentro un array
    else if (isArrayItem && parentKey) {
      // items[0] → Item (singolare di items)
      baseName = this.singularize(parentKey);
    }
    // CASO 3: Oggetto nested normale
    else {
      // customer.address → Address (usa il nome della proprietà)
      baseName = this.toPascalCase(currentKey);
    }

    // Ensure baseName is PascalCase if not already processed
    if (!isArrayItem && path.length > 0) {
      baseName = this.toPascalCase(baseName);
    }

    // Handle conflicts with contextual names
    if (this.usedNames.has(baseName)) {
      baseName = this.nameResolver.resolveConflict(
        baseName,
        path,
        currentKey,
        this.usedNames,
        parentKey,
        isArrayItem
      );
    }

    this.usedNames.add(baseName);
    return baseName;
  }

  private singularize(word: string): string {
    // items → Item
    // addresses → Address
    // data → Data (invariato)
    // categories → Category
    word = word.toLowerCase();

    if (word.endsWith('ies')) return this.toPascalCase(word.slice(0, -3) + 'y');
    if (word.endsWith('oes')) return this.toPascalCase(word.slice(0, -2));
    if (word.endsWith('ves')) return this.toPascalCase(word.slice(0, -3) + 'f');
    if (word.endsWith('es') && word.length > 3)
      return this.toPascalCase(word.slice(0, -2));
    if (word.endsWith('s') && word.length > 1)
      return this.toPascalCase(word.slice(0, -1));

    return this.toPascalCase(word);
  }

  private toPascalCase(str: string): string {
    // payment_card → PaymentCard
    // paymentCard → PaymentCard
    // payment-card → PaymentCard
    return str
      .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, ''); // Remove any other special chars
  }

  reset() {
    this.usedNames.clear();
    this.nameResolver.reset();
  }
}

// Interface name conflict resolver with contextual names
class InterfaceNameResolver {
  private contextualSuffixes = new Map<string, string[]>();
  private usageCount = new Map<string, number>();

  resolveConflict(
    baseName: string,
    path: string[],
    currentKey: string,
    usedNames: Set<string>,
    parentKey?: string,
    isArrayItem: boolean = false
  ): string {
    // Strategy 1: Use contextual suffixes based on the path
    const contextualName = this.generateContextualName(
      baseName,
      path,
      currentKey,
      isArrayItem,
      parentKey
    );

    if (contextualName && !usedNames.has(contextualName)) {
      return contextualName;
    }

    // Strategy 2: Try common suffixes for the base name
    const commonSuffixes = this.getCommonSuffixes(
      baseName,
      currentKey,
      parentKey
    );
    for (const suffix of commonSuffixes) {
      const candidateName = baseName + suffix;
      if (!usedNames.has(candidateName)) {
        return candidateName;
      }
    }

    // Strategy 3: Fall back to numbers as last resort
    const count = this.usageCount.get(baseName) || 1;
    this.usageCount.set(baseName, count + 1);
    return baseName + (count + 1);
  }

  private generateContextualName(
    baseName: string,
    path: string[],
    currentKey: string,
    isArrayItem: boolean,
    parentKey?: string
  ): string | null {
    // For array items, try to use grandparent context
    if (isArrayItem && path.length > 1) {
      const grandParent = path[path.length - 2];
      const contextName = this.toPascalCase(grandParent) + baseName;
      return contextName;
    }

    // For nested objects, use parent context
    if (parentKey && !isArrayItem) {
      const contextName = this.toPascalCase(parentKey) + baseName;
      return contextName;
    }

    // Use path-based context for deep nesting
    if (path.length > 2) {
      const relevantPath = path[path.length - 2]; // Second to last path element
      const contextName = this.toPascalCase(relevantPath) + baseName;
      return contextName;
    }

    return null;
  }

  private getCommonSuffixes(
    baseName: string,
    currentKey: string,
    parentKey?: string
  ): string[] {
    const suffixes: string[] = [];

    // Based on common patterns
    if (baseName === 'Item') {
      suffixes.push('Data', 'Info', 'Details', 'Object', 'Record');
    } else if (baseName === 'User') {
      suffixes.push('Info', 'Profile', 'Data', 'Details', 'Account');
    } else if (baseName === 'Product') {
      suffixes.push('Info', 'Details', 'Data', 'Spec', 'Config');
    } else if (baseName === 'Config') {
      suffixes.push('Data', 'Options', 'Settings', 'Info');
    } else if (baseName === 'Response') {
      suffixes.push('Data', 'Body', 'Payload', 'Result');
    } else {
      // Generic suffixes
      suffixes.push('Data', 'Info', 'Details', 'Config', 'Options', 'Spec');
    }

    // Add parent-based suffix if available
    if (parentKey) {
      const parentSuffix = this.toPascalCase(parentKey);
      if (!suffixes.includes(parentSuffix)) {
        suffixes.unshift(parentSuffix); // Prioritize parent context
      }
    }

    return suffixes;
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  reset() {
    this.contextualSuffixes.clear();
    this.usageCount.clear();
  }
}

// Default options
export const DEFAULT_OPTIONS: JsonToTypeScriptOptions = {
  namingStrategy: 'PascalCase',
  rootInterfaceName: 'RootObject',
  useInterfaces: true,
  arrayNotation: 'array',
  dateHandling: 'string-with-comment',
  nullHandling: 'union',
  optionalHandling: 'loose',
  exportStyle: 'export',
  separateInterfaces: true,
  extractNestedTypes: true,
  enableReadonly: false,
  detectEnums: true,
  inferDates: true,
  enableStringLiterals: false,
  maxDepth: 20,
  includeComments: true,
  includeExports: true,
  sortProperties: false,
  indentSize: 2,
  indentType: 'spaces',
  generateZodSchema: false,
  generateJsonSchema: false,
  generateValidationCode: false,
};

// Pattern recognition for special types
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/[^\s]+$/;

/**
 * Main conversion function - converts JSON to TypeScript interfaces
 */
export function convertJsonToTypeScript(
  jsonInput: string,
  options: Partial<JsonToTypeScriptOptions> = {}
): TypeScriptGenerationResult {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Parse and validate JSON
    let jsonData: any;
    try {
      jsonData = JSON.parse(jsonInput);
    } catch {
      // Fallback: try converting Python dict syntax to JSON
      try {
        const converted = pythonToJson(jsonInput);
        jsonData = JSON.parse(converted);
      } catch (error) {
        return {
          success: false,
          error: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`,
          interfaces: '',
          detectedTypes: [],
          circularReferences: [],
          warnings: [],
          stats: {
            interfaceCount: 0,
            propertyCount: 0,
            depth: 0,
            processingTime: 0,
          },
        };
      }
    }

    // Initialize processing context
    const context: ProcessingContext = {
      types: new Map(),
      dependencies: new Set(),
      circularRefs: new Set(),
      nameGenerator: new InterfaceNameGenerator(),
      depth: 0,
      options: opts,
    };

    // Analyze JSON structure and infer types
    const rootType = analyzeValue(
      jsonData,
      opts.rootInterfaceName,
      '',
      context
    );

    // Generate TypeScript interfaces
    let interfaces: string;
    if (
      typeof jsonData === 'object' &&
      jsonData !== null &&
      !Array.isArray(jsonData)
    ) {
      // Object root - generate interfaces
      interfaces = generateInterfaces(context);
    } else {
      // Primitive or array root - generate type alias
      const exportKeyword = opts.includeExports ? 'export ' : '';
      const typeKeyword = opts.useInterfaces ? 'interface' : 'type';

      if (opts.includeComments) {
        interfaces = `// Generated TypeScript type\n// Created with ToolsLab JSON to TypeScript Converter\n\n`;
      } else {
        interfaces = '';
      }

      if (opts.useInterfaces && typeof jsonData === 'object') {
        interfaces += `${exportKeyword}${typeKeyword} ${opts.rootInterfaceName} {\n  [key: string]: ${rootType.type};\n}`;
      } else {
        interfaces += `${exportKeyword}${typeKeyword} ${opts.rootInterfaceName} = ${rootType.type};`;
      }
    }

    // Generate additional schemas if requested
    let zodSchema: string | undefined;
    let jsonSchema: string | undefined;
    let validationCode: string | undefined;

    if (opts.generateZodSchema) {
      zodSchema = generateZodSchema(context);
    }

    if (opts.generateJsonSchema) {
      jsonSchema = generateJsonSchemaOutput(jsonData, opts.rootInterfaceName);
    }

    if (opts.generateValidationCode) {
      validationCode = generateValidationCode(context);
    }

    // Collect detected types for analysis
    const detectedTypes: DetectedType[] = [];

    // Add root type if it's a primitive
    if (typeof jsonData !== 'object' || Array.isArray(jsonData)) {
      detectedTypes.push({
        name: opts.rootInterfaceName,
        type: rootType.type,
        path: '',
        isOptional: rootType.isOptional,
        isArray: rootType.isArray,
        examples: rootType.examples || [jsonData],
      });
    }

    // Add interface types
    for (const [name, type] of context.types) {
      if (type.children) {
        // Add properties of interfaces
        for (const [propName, propInfo] of Object.entries(type.children)) {
          detectedTypes.push({
            name: `${name}.${propName}`,
            type: propInfo.type,
            path: `${name}.${propName}`,
            isOptional: propInfo.isOptional,
            isArray: propInfo.isArray,
            examples: propInfo.examples,
          });
        }
      } else {
        detectedTypes.push({
          name,
          type: type.type,
          path: name,
          isOptional: type.isOptional,
          isArray: type.isArray,
          examples: type.examples,
        });
      }
    }

    const endTime = performance.now();

    return {
      success: true,
      interfaces,
      zodSchema,
      jsonSchema,
      validationCode,
      detectedTypes,
      circularReferences: Array.from(context.circularRefs),
      warnings: [], // TODO: Implement warning collection
      stats: {
        interfaceCount: context.types.size,
        propertyCount: detectedTypes.length,
        depth: context.depth,
        processingTime: endTime - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      interfaces: '',
      detectedTypes: [],
      circularReferences: [],
      warnings: [],
      stats: {
        interfaceCount: 0,
        propertyCount: 0,
        depth: 0,
        processingTime: 0,
      },
    };
  }
}

/**
 * Analyzes a JSON value and infers its TypeScript type
 */
function analyzeValue(
  value: any,
  name: string,
  path: string,
  context: ProcessingContext,
  parentKey?: string,
  isArrayItem: boolean = false
): TypeInfo {
  context.depth++;

  if (context.depth > context.options.maxDepth) {
    throw new Error(`Maximum depth exceeded (${context.options.maxDepth})`);
  }

  const typeInfo: TypeInfo = {
    type: 'any',
    isOptional: false,
    isArray: false,
    examples: [value],
  };

  if (value === null) {
    // For null values, we need to infer what the actual type should be
    // based on context or use a sensible default
    typeInfo.type = inferNullType(name, path, context);
    typeInfo.isOptional = context.options.nullHandling === 'optional';
  } else if (value === undefined) {
    typeInfo.type = 'undefined';
    typeInfo.isOptional = true;
  } else if (typeof value === 'boolean') {
    typeInfo.type = 'boolean';
  } else if (typeof value === 'number') {
    typeInfo.type = 'number';
  } else if (typeof value === 'string') {
    typeInfo.type = inferStringType(value, context.options);
  } else if (Array.isArray(value)) {
    context.depth--;
    return analyzeArray(value, name, path, context, parentKey);
  } else if (typeof value === 'object') {
    context.depth--;
    return analyzeObject(value, name, path, context, parentKey, isArrayItem);
  }

  context.depth--;
  return typeInfo;
}

/**
 * Infers the likely type for null values based on context
 */
function inferNullType(
  name: string,
  path: string,
  context: ProcessingContext
): string {
  const lowerName = name.toLowerCase();
  const lowerPath = path.toLowerCase();

  // Common patterns for type inference
  if (lowerName.includes('id') || lowerName.includes('uuid')) {
    return context.options.nullHandling === 'union'
      ? 'string | null'
      : 'string';
  }
  if (
    lowerName.includes('name') ||
    lowerName.includes('title') ||
    lowerName.includes('description')
  ) {
    return context.options.nullHandling === 'union'
      ? 'string | null'
      : 'string';
  }
  if (
    lowerName.includes('count') ||
    lowerName.includes('number') ||
    lowerName.includes('amount')
  ) {
    return context.options.nullHandling === 'union'
      ? 'number | null'
      : 'number';
  }
  if (
    lowerName.includes('date') ||
    lowerName.includes('time') ||
    lowerName.includes('created') ||
    lowerName.includes('updated')
  ) {
    const baseType =
      context.options.dateHandling === 'Date' ? 'Date' : 'string';
    return context.options.nullHandling === 'union'
      ? `${baseType} | null`
      : baseType;
  }
  if (
    lowerName.includes('is') ||
    lowerName.includes('has') ||
    lowerName.includes('enable')
  ) {
    return context.options.nullHandling === 'union'
      ? 'boolean | null'
      : 'boolean';
  }
  if (
    lowerName.includes('url') ||
    lowerName.includes('link') ||
    lowerName.includes('href')
  ) {
    return context.options.nullHandling === 'union'
      ? 'string | null'
      : 'string';
  }

  // Default to string | null for unknown null fields
  return context.options.nullHandling === 'union' ? 'string | null' : 'string';
}

/**
 * Infers specific string types based on patterns
 */
function inferStringType(
  value: string,
  options: JsonToTypeScriptOptions
): string {
  // Date detection based on dateHandling option
  if (DATE_PATTERN.test(value)) {
    switch (options.dateHandling) {
      case 'Date':
        return 'Date';
      case 'string-with-comment':
        return 'string'; // Comment will be added later
      case 'string':
      default:
        return 'string';
    }
  }

  // UUID detection
  if (UUID_PATTERN.test(value)) {
    return 'string'; // Could be a specific UUID type
  }

  // Email detection
  if (EMAIL_PATTERN.test(value)) {
    return 'string'; // Could add Email branded type
  }

  // URL detection
  if (URL_PATTERN.test(value)) {
    return 'string'; // Could add URL branded type
  }

  // String literals
  if (options.enableStringLiterals && value.length < 50) {
    return `"${value}"`;
  }

  return 'string';
}

/**
 * Analyzes array values and determines element types
 */
function analyzeArray(
  array: any[],
  name: string,
  path: string,
  context: ProcessingContext,
  parentKey?: string
): TypeInfo {
  if (array.length === 0) {
    const arrayNotation =
      context.options.arrayNotation === 'array' ? 'any[]' : 'Array<any>';
    return {
      type: arrayNotation,
      isArray: true,
      isOptional: false,
      examples: [],
    };
  }

  // For objects in arrays, we need to merge all properties to create a single interface
  const isObjectArray = array.some(
    (item) => typeof item === 'object' && item !== null && !Array.isArray(item)
  );

  if (isObjectArray) {
    // Merge all object properties to create a comprehensive interface
    const mergedProperties: Record<string, any> = {};
    const nullableProperties = new Set<string>();

    // Collect all properties from all objects
    for (const item of array) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        for (const [key, value] of Object.entries(item)) {
          if (value === null) {
            nullableProperties.add(key);
          }
          if (!(key in mergedProperties) || mergedProperties[key] === null) {
            mergedProperties[key] = value;
          }
        }
      }
    }

    // Generate proper interface name for array items
    const pathParts = path.split('.');
    const itemInterfaceName = context.nameGenerator.generateInterfaceName(
      pathParts,
      name,
      parentKey,
      true // isArrayItem = true
    );

    // Analyze the merged object
    const mergedObject = analyzeObject(
      mergedProperties,
      itemInterfaceName,
      `${path}[item]`,
      context,
      parentKey,
      true
    );

    // Mark nullable properties as optional in the interface
    if (mergedObject.children) {
      for (const propName of nullableProperties) {
        if (mergedObject.children[propName]) {
          mergedObject.children[propName].isOptional = true;
        }
      }
    }

    const arrayNotation =
      context.options.arrayNotation === 'array'
        ? `${mergedObject.type}[]`
        : `Array<${mergedObject.type}>`;

    return {
      type: arrayNotation,
      isArray: true,
      isOptional: false,
      examples: array.slice(0, 3),
    };
  } else {
    // Non-object array - analyze element types
    const elementTypes = new Set<string>();
    const elementExamples: any[] = [];

    for (let i = 0; i < Math.min(array.length, 10); i++) {
      const elementInfo = analyzeValue(
        array[i],
        `${name}Item`,
        `${path}[${i}]`,
        context,
        parentKey
      );
      elementTypes.add(elementInfo.type);
      elementExamples.push(array[i]);
    }

    let elementType: string;
    if (elementTypes.size === 1) {
      elementType = elementTypes.values().next().value || 'unknown';
    } else {
      // Union type for mixed arrays - wrap in parentheses for clarity
      elementType = `(${Array.from(elementTypes).join(' | ')})`;
    }

    const arrayNotation =
      context.options.arrayNotation === 'array'
        ? `${elementType}[]`
        : `Array<${elementType}>`;

    return {
      type: arrayNotation,
      isArray: true,
      isOptional: false,
      examples: elementExamples,
    };
  }
}

/**
 * Analyzes object structure and creates interface definitions
 */
function analyzeObject(
  obj: Record<string, any>,
  name: string,
  path: string,
  context: ProcessingContext,
  parentKey?: string,
  isArrayItem: boolean = false
): TypeInfo {
  // Generate clean interface name using the new algorithm
  const pathParts = path.split('.').filter(Boolean);
  let interfaceName: string;

  if (pathParts.length === 0) {
    // Root object
    interfaceName = context.options.rootInterfaceName;
  } else if (isArrayItem && parentKey) {
    // Array item - use singularized parent name
    interfaceName = context.nameGenerator.generateInterfaceName(
      pathParts,
      name,
      parentKey,
      true
    );
  } else {
    // Regular nested object - use current key name
    interfaceName = context.nameGenerator.generateInterfaceName(
      pathParts,
      name,
      parentKey,
      false
    );
  }

  // Check for circular references
  if (context.types.has(interfaceName)) {
    context.circularRefs.add(interfaceName);
    return {
      type: interfaceName,
      isOptional: false,
      isArray: false,
      interfaceName,
    };
  }

  const properties: Record<string, TypeInfo> = {};

  // Analyze each property
  for (const [key, value] of Object.entries(obj)) {
    const propPath = path ? `${path}.${key}` : key;

    // For nested objects/arrays, generate clean names
    let nestedName: string;
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // For arrays, use the property name as base
        nestedName = key;
      } else {
        // For objects, use the property name directly
        nestedName = key;
      }
    } else {
      nestedName = key;
    }

    properties[key] = analyzeValue(value, nestedName, propPath, context, key);
  }

  const interfaceInfo: TypeInfo = {
    type: interfaceName,
    isOptional: false,
    isArray: false,
    children: properties,
    interfaceName,
  };

  context.types.set(interfaceName, interfaceInfo);

  return interfaceInfo;
}

/**
 * Formats names according to naming strategy
 */
function formatName(
  name: string,
  strategy: JsonToTypeScriptOptions['namingStrategy']
): string {
  switch (strategy) {
    case 'PascalCase':
      return name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .split('_')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    case 'camelCase':
      const pascalCase = formatName(name, 'PascalCase');
      return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);

    case 'snake_case':
      return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    case 'preserve':
    default:
      return name;
  }
}

/**
 * Generates TypeScript interface code from analyzed types
 */
function generateInterfaces(context: ProcessingContext): string {
  const { options } = context;
  const indent =
    options.indentType === 'tabs' ? '\t' : ' '.repeat(options.indentSize);
  const lines: string[] = [];

  // Add header comment
  if (options.includeComments) {
    lines.push('// Generated TypeScript interfaces');
    lines.push('// Created with ToolsLab JSON to TypeScript Converter');
    lines.push('');
  }

  // Generate interfaces in dependency order
  for (const [interfaceName, typeInfo] of context.types) {
    if (!typeInfo.children) continue;

    // Interface declaration
    let exportKeyword = '';
    switch (options.exportStyle) {
      case 'export':
        exportKeyword = 'export ';
        break;
      case 'declare':
        exportKeyword = 'declare ';
        break;
      case 'none':
      default:
        exportKeyword = '';
        break;
    }

    const keyword = options.useInterfaces ? 'interface' : 'type';
    const separator = options.useInterfaces ? ' {' : ' = {';

    lines.push(`${exportKeyword}${keyword} ${interfaceName}${separator}`);

    // Properties
    const properties = Object.entries(typeInfo.children);
    if (options.sortProperties) {
      properties.sort(([a], [b]) => a.localeCompare(b));
    }

    for (const [propName, propInfo] of properties) {
      const readonly = options.enableReadonly ? 'readonly ' : '';

      // Handle null/optional types correctly
      let propType = propInfo.type;
      let optional = '';

      if (propInfo.isOptional) {
        if (options.nullHandling === 'optional') {
          optional = '?';
          // Don't include null in the type if using optional syntax
          if (propType === 'null') {
            propType = 'any'; // Will be inferred from usage
          }
        } else {
          // Union with null
          if (propType !== 'null') {
            propType = `${propType} | null`;
          }
        }
      }

      // Quote property names that need it
      const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName);
      const quotedPropName = needsQuotes ? `"${propName}"` : propName;

      let line = `${indent}${readonly}${quotedPropName}${optional}: ${propType};`;

      // Add comments for special cases
      if (options.includeComments) {
        const comment = generatePropertyComment(propName, propInfo, options);
        if (comment) {
          line += ` ${comment}`;
        }
      }

      lines.push(line);
    }

    if (options.useInterfaces) {
      lines.push('}');
    } else {
      lines.push('};');
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates Zod schema for runtime validation
 */
function generateZodSchema(context: ProcessingContext): string {
  const lines: string[] = [];
  lines.push("import { z } from 'zod';");
  lines.push('');

  for (const [interfaceName, typeInfo] of context.types) {
    if (!typeInfo.children) continue;

    lines.push(`export const ${interfaceName}Schema = z.object({`);

    for (const [propName, propInfo] of Object.entries(typeInfo.children)) {
      let zodType = mapTypeToZod(propInfo.type);
      if (propInfo.isOptional) {
        zodType += '.optional()';
      }
      lines.push(`  ${propName}: ${zodType},`);
    }

    lines.push('});');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates appropriate comments for interface properties
 */
function generatePropertyComment(
  propName: string,
  propInfo: TypeInfo,
  options: JsonToTypeScriptOptions
): string | null {
  if (!propInfo.examples || propInfo.examples.length === 0) {
    return null;
  }

  const example = propInfo.examples[0];

  // Special comment for dates when using string-with-comment
  if (
    options.dateHandling === 'string-with-comment' &&
    typeof example === 'string' &&
    DATE_PATTERN.test(example)
  ) {
    return `// ISO 8601 date: "${example}"`;
  }

  // Concise comments for arrays
  if (propInfo.isArray && Array.isArray(example)) {
    if (example.length === 0) {
      return '// Empty array';
    }

    const firstItem = example[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      return `// Array of ${propInfo.type.replace('[]', '')} objects`;
    } else {
      const itemType = typeof firstItem;
      return `// Array of ${itemType} values`;
    }
  }

  // For objects, show the structure rather than full example
  if (
    typeof example === 'object' &&
    example !== null &&
    !Array.isArray(example)
  ) {
    const keys = Object.keys(example);
    if (keys.length <= 3) {
      return `// Object with: ${keys.join(', ')}`;
    } else {
      return `// Object with ${keys.length} properties`;
    }
  }

  // For primitives, show example but keep it short
  if (typeof example === 'string' && example.length > 50) {
    return `// Example: "${example.substring(0, 47)}..."`;
  }

  // Regular example comment
  const exampleStr = JSON.stringify(example);
  if (exampleStr.length > 60) {
    return `// Example: ${exampleStr.substring(0, 57)}...`;
  }

  return `// Example: ${exampleStr}`;
}

/**
 * Maps TypeScript types to Zod types
 */
function mapTypeToZod(type: string): string {
  if (type.includes('[]')) {
    const baseType = type.replace('[]', '');
    return `z.array(${mapTypeToZod(baseType)})`;
  }

  switch (type) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'Date':
      return 'z.date()';
    case 'null':
      return 'z.null()';
    default:
      if (type.includes('|')) {
        const unionTypes = type.split(' | ').map((t) => mapTypeToZod(t.trim()));
        return `z.union([${unionTypes.join(', ')}])`;
      }
      return 'z.any()';
  }
}

/**
 * Generates JSON Schema
 */
function generateJsonSchemaOutput(jsonData: unknown, title: string): string {
  // Inference lives in the JSON Schema Generator tool — same engine, so the
  // schema emitted here matches what that tool produces for the same sample.
  const { document } = buildSchemaDocument(jsonData, { title });
  return JSON.stringify(document, null, 2);
}

/**
 * Generates validation functions
 */
function generateValidationCode(context: ProcessingContext): string {
  const lines: string[] = [];

  lines.push('// Runtime validation functions');
  lines.push('');

  for (const [interfaceName] of context.types) {
    lines.push(
      `export function is${interfaceName}(value: any): value is ${interfaceName} {`
    );
    lines.push('  // Implementation would validate object structure');
    lines.push('  return typeof value === "object" && value !== null;');
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Validates JSON input and provides detailed error information
 */
export function validateJsonInput(input: string): {
  valid: boolean;
  error?: string;
  formatted?: string;
} {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(input);
    } catch {
      const converted = pythonToJson(input);
      parsed = JSON.parse(converted);
    }
    const formatted = JSON.stringify(parsed, null, 2);
    return { valid: true, formatted };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    };
  }
}

/**
 * Detects and extracts common enum patterns
 */
export function detectEnums(jsonData: any): Record<string, string[]> {
  const enums: Record<string, string[]> = {};

  function traverse(obj: any, path: string = ''): void {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string' && value.length < 50) {
          // Collect string values for potential enum detection
          if (!enums[newPath]) enums[newPath] = [];
          if (!enums[newPath].includes(value)) {
            enums[newPath].push(value);
          }
        }

        traverse(value, newPath);
      });
    }
  }

  traverse(jsonData);

  // Filter to only include paths with multiple distinct values
  Object.keys(enums).forEach((key) => {
    if (enums[key].length < 2) {
      delete enums[key];
    }
  });

  return enums;
}

/**
 * Example JSON samples for testing and demonstration
 */
export const EXAMPLE_JSON_SAMPLES = {
  'API Response': {
    name: 'User API Response',
    json: JSON.stringify(
      {
        user: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          isActive: true,
          roles: ['admin', 'user'],
          createdAt: '2025-09-25T00:00:00Z',
          profile: {
            avatar: 'https://example.com/avatar.jpg',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      },
      null,
      2
    ),
  },

  'Configuration Object': {
    name: 'App Configuration',
    json: JSON.stringify(
      {
        app: {
          name: 'MyApp',
          version: '1.0.0',
          port: 3000,
          debug: true,
          database: {
            host: 'localhost',
            port: 5432,
            name: 'myapp_db',
            ssl: false,
          },
          features: {
            auth: true,
            analytics: false,
            cache: true,
          },
        },
      },
      null,
      2
    ),
  },

  'Complex Nested': {
    name: 'E-commerce Product',
    json: JSON.stringify(
      {
        product: {
          id: 'prod_123',
          name: 'Laptop',
          price: 999.99,
          currency: 'USD',
          inStock: true,
          categories: ['electronics', 'computers'],
          specifications: {
            cpu: 'Intel i7',
            ram: '16GB',
            storage: '512GB SSD',
            ports: ['USB-C', 'HDMI', 'USB-A'],
          },
          reviews: [
            {
              id: 'rev_1',
              author: 'Alice',
              rating: 5,
              comment: 'Great laptop!',
              date: '2024-01-15T10:30:00Z',
            },
            {
              id: 'rev_2',
              author: 'Bob',
              rating: 4,
              comment: 'Good performance',
              date: '2024-01-20T14:45:00Z',
            },
          ],
        },
      },
      null,
      2
    ),
  },
};
