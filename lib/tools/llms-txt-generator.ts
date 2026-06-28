/**
 * Generate an `llms.txt` file — the emerging standard (llmstxt.org) that tells
 * AI crawlers like ChatGPT, Claude and Perplexity where a site's key content
 * lives. The format is plain Markdown: an H1 name, an optional blockquote
 * summary, optional free text, then H2 sections of `- [title](url): notes`
 * link lists. All functions are pure and unit-tested.
 */

export interface LlmsLink {
  title: string;
  url: string;
  notes?: string;
}

export interface LlmsSection {
  title: string;
  links: LlmsLink[];
}

export interface LlmsTxtInput {
  /** Site / project name (the H1). */
  name: string;
  /** One-line summary, rendered as a blockquote. */
  summary?: string;
  /** Optional free-form details paragraph(s). */
  details?: string;
  sections: LlmsSection[];
}

export interface LlmsTxtResult {
  success: boolean;
  result?: string;
  error?: string;
}

/** Render a single link line: `- [title](url): notes`. */
function renderLink(link: LlmsLink): string | null {
  const title = link.title.trim();
  const url = link.url.trim();
  if (!title || !url) return null;
  const notes = link.notes?.trim();
  return notes ? `- [${title}](${url}): ${notes}` : `- [${title}](${url})`;
}

/** Build the llms.txt Markdown from structured input. */
export function generateLlmsTxt(input: LlmsTxtInput): LlmsTxtResult {
  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: 'A project name is required' };
  }

  const parts: string[] = [`# ${name}`];

  const summary = input.summary?.trim();
  if (summary) parts.push(`> ${summary}`);

  const details = input.details?.trim();
  if (details) parts.push(details);

  for (const section of input.sections) {
    const title = section.title?.trim();
    const lines = section.links.map(renderLink).filter((l): l is string => l !== null);
    if (!title || lines.length === 0) continue;
    parts.push(`## ${title}\n${lines.join('\n')}`);
  }

  // Blocks separated by a blank line, single trailing newline.
  return { success: true, result: parts.join('\n\n') + '\n' };
}

/** A minimal starter template for the UI. */
export function llmsTxtStarter(): LlmsTxtInput {
  return {
    name: 'My Project',
    summary: 'A short, information-dense summary of what this site offers.',
    details:
      'Optional: a paragraph with extra context an LLM should know before following the links below.',
    sections: [
      {
        title: 'Docs',
        links: [
          { title: 'Getting Started', url: 'https://example.com/docs/start', notes: 'Setup and first steps' },
          { title: 'API Reference', url: 'https://example.com/docs/api' },
        ],
      },
      {
        title: 'Optional',
        links: [{ title: 'Changelog', url: 'https://example.com/changelog' }],
      },
    ],
  };
}
