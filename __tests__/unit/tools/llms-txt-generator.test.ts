import {
  generateLlmsTxt,
  llmsTxtStarter,
  LlmsTxtInput,
} from '@/lib/tools/llms-txt-generator';

const base: LlmsTxtInput = {
  name: 'Acme',
  summary: 'Acme does things.',
  details: 'More about Acme.',
  sections: [
    {
      title: 'Docs',
      links: [
        { title: 'Start', url: 'https://acme.com/start', notes: 'Begin here' },
        { title: 'API', url: 'https://acme.com/api' },
      ],
    },
  ],
};

describe('llms.txt Generator', () => {
  describe('generateLlmsTxt', () => {
    it('renders a full document', () => {
      const r = generateLlmsTxt(base);
      expect(r.success).toBe(true);
      expect(r.result).toBe(
        '# Acme\n\n> Acme does things.\n\nMore about Acme.\n\n## Docs\n- [Start](https://acme.com/start): Begin here\n- [API](https://acme.com/api)\n'
      );
    });

    it('requires a name', () => {
      const r = generateLlmsTxt({ ...base, name: '   ' });
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/name is required/);
    });

    it('omits summary and details when empty', () => {
      const r = generateLlmsTxt({ name: 'X', sections: [] });
      expect(r.result).toBe('# X\n');
    });

    it('skips links missing a title or url', () => {
      const r = generateLlmsTxt({
        name: 'X',
        sections: [
          {
            title: 'S',
            links: [
              { title: '', url: 'https://x.com' },
              { title: 'Good', url: 'https://x.com/g' },
              { title: 'NoUrl', url: '' },
            ],
          },
        ],
      });
      expect(r.result).toBe('# X\n\n## S\n- [Good](https://x.com/g)\n');
    });

    it('skips sections with no valid links', () => {
      const r = generateLlmsTxt({
        name: 'X',
        sections: [{ title: 'Empty', links: [{ title: '', url: '' }] }],
      });
      expect(r.result).toBe('# X\n');
    });

    it('skips sections without a title', () => {
      const r = generateLlmsTxt({
        name: 'X',
        sections: [{ title: '', links: [{ title: 'A', url: 'https://x.com' }] }],
      });
      expect(r.result).toBe('# X\n');
    });

    it('trims whitespace in fields', () => {
      const r = generateLlmsTxt({
        name: '  Acme  ',
        summary: '  hi  ',
        sections: [],
      });
      expect(r.result).toBe('# Acme\n\n> hi\n');
    });
  });

  describe('llmsTxtStarter', () => {
    it('produces a valid template that generates output', () => {
      const starter = llmsTxtStarter();
      const r = generateLlmsTxt(starter);
      expect(r.success).toBe(true);
      expect(r.result).toContain('# My Project');
      expect(r.result).toContain('## Docs');
    });
  });
});
