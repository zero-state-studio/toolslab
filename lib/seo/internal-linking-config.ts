/**
 * Internal Linking Configuration
 *
 * Configuration for the intelligent internal linking system
 */

export interface InternalLinkingConfig {
  // Link count constraints
  minLinksPerTool: number;
  maxLinksPerTool: number;
  relatedToolsPerPage: number;

  // Algorithm weights (must sum to 1.0)
  weights: {
    sameCategory: number; // Tools in same category
    workflow: number; // Tools in same workflow
    underlinked: number; // Boost for under-linked tools
    popular: number; // Popular tools for UX
  };

  // Tools that need visibility boost
  boostTools: string[];

  // Thresholds for link distribution
  thresholds: {
    orphan: number; // < this = orphan page
    underlinked: number; // < this = needs more links
    wellLinked: number; // Optimal range
    overlinked: number; // > this = too many links
  };
}

export const internalLinkingConfig: InternalLinkingConfig = {
  // Constraints
  minLinksPerTool: 3,
  maxLinksPerTool: 15,
  relatedToolsPerPage: 4,

  // Algorithm weights (total = 1.0)
  weights: {
    sameCategory: 0.4, // 40% - Semantic relevance
    workflow: 0.3, // 30% - Workflow relationships
    underlinked: 0.2, // 20% - Boost orphan pages
    popular: 0.1, // 10% - User experience
  },

  // Tools requiring visibility boost (updated from tool-relationships.ts)
  boostTools: [
    'eml-to-html', // Critical - major orphan
    'favicon-generator', // Critical
    'unix-timestamp-converter', // Critical
    'crontab-builder', // High priority
    'list-compare', // High priority
    'gradient-generator', // Medium priority
    'image-resizer', // Medium priority
    'base64-to-pdf', // Medium priority
  ],

  // Link count thresholds
  thresholds: {
    orphan: 3, // Less than 3 links
    underlinked: 5, // 3-5 links
    wellLinked: 10, // 6-10 links
    overlinked: 15, // More than 15 links
  },
};

/**
 * Validation function to ensure config is valid
 */
export function validateConfig(config: InternalLinkingConfig): boolean {
  // Check weights sum to 1.0
  const weightsSum = Object.values(config.weights).reduce(
    (sum, w) => sum + w,
    0
  );
  if (Math.abs(weightsSum - 1.0) > 0.01) {
    console.error('❌ Weights must sum to 1.0, got:', weightsSum);
    return false;
  }

  // Check constraints are logical
  if (config.minLinksPerTool >= config.maxLinksPerTool) {
    console.error('❌ minLinksPerTool must be less than maxLinksPerTool');
    return false;
  }

  if (config.relatedToolsPerPage < 3 || config.relatedToolsPerPage > 6) {
    console.warn(
      '⚠️  relatedToolsPerPage should be between 3-6 for optimal UX'
    );
  }

  return true;
}

// Validate on import
if (!validateConfig(internalLinkingConfig)) {
  throw new Error('Invalid internal linking configuration');
}
