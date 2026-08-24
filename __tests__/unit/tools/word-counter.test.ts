import {
  countText,
  formatDuration,
  WordCounterStats,
} from '@/lib/tools/word-counter';

const meta = (input: string): WordCounterStats => {
  const r = countText(input);
  expect(r.success).toBe(true);
  return r.metadata as WordCounterStats;
};

describe('Word Counter & Reading Time', () => {
  describe('words', () => {
    it('counts simple words', () => {
      expect(meta('hello world').words).toBe(2);
    });

    it('collapses multiple spaces, tabs and newlines', () => {
      expect(meta('one   two\tthree\nfour').words).toBe(4);
    });

    it('returns 0 words for empty input', () => {
      expect(meta('').words).toBe(0);
    });

    it('returns 0 words for whitespace-only input', () => {
      expect(meta('   \n\t  ').words).toBe(0);
    });

    it('counts unicode words', () => {
      expect(meta('café déjà vu').words).toBe(3);
    });
  });

  describe('characters', () => {
    it('counts characters including spaces', () => {
      expect(meta('hello world').characters).toBe(11);
    });

    it('counts characters excluding whitespace', () => {
      expect(meta('hello world').charactersNoSpaces).toBe(10);
    });

    it('counts emoji as a single code point', () => {
      // '👍' is a surrogate pair; should count as 1 character.
      expect(meta('👍').characters).toBe(1);
    });

    it('excludes newlines and tabs from no-spaces count', () => {
      expect(meta('a\nb\tc').charactersNoSpaces).toBe(3);
    });
  });

  describe('sentences', () => {
    it('counts sentences ending in period, question, exclamation', () => {
      expect(meta('Hi there. How are you? Great!').sentences).toBe(3);
    });

    it('collapses repeated terminators', () => {
      expect(meta('Really?! Yes...').sentences).toBe(2);
    });

    it('counts trailing text with no terminator as a sentence', () => {
      expect(meta('No punctuation here').sentences).toBe(1);
    });

    it('returns 0 sentences for empty input', () => {
      expect(meta('').sentences).toBe(0);
    });
  });

  describe('paragraphs and lines', () => {
    it('counts paragraphs separated by blank lines', () => {
      expect(meta('Para one.\n\nPara two.\n\nPara three.').paragraphs).toBe(3);
    });

    it('treats single newlines as one paragraph', () => {
      expect(meta('line one\nline two').paragraphs).toBe(1);
    });

    it('counts lines', () => {
      expect(meta('a\nb\nc').lines).toBe(3);
    });

    it('returns 0 lines for empty input', () => {
      expect(meta('').lines).toBe(0);
    });
  });

  describe('reading and speaking time', () => {
    it('estimates reading time at default 200 wpm', () => {
      const words = Array(200).fill('word').join(' ');
      const r = countText(words);
      expect(r.metadata?.readingTimeSeconds).toBeCloseTo(60, 5);
      expect(r.metadata?.readingTime).toBe('1 min');
    });

    it('estimates speaking time slower than reading time', () => {
      const words = Array(130).fill('word').join(' ');
      const r = countText(words);
      expect(r.metadata?.speakingTimeSeconds).toBeGreaterThan(
        r.metadata?.readingTimeSeconds as number
      );
    });

    it('honors custom wpm options', () => {
      const words = Array(100).fill('word').join(' ');
      const r = countText(words, { readingWpm: 100 });
      expect(r.metadata?.readingTimeSeconds).toBeCloseTo(60, 5);
    });
  });

  describe('formatDuration', () => {
    it('formats sub-minute durations', () => {
      expect(formatDuration(15)).toBe('15 sec');
    });

    it('formats whole minutes', () => {
      expect(formatDuration(120)).toBe('2 min');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(135)).toBe('2 min 15 sec');
    });

    it('formats zero as 0 sec', () => {
      expect(formatDuration(0)).toBe('0 sec');
    });
  });

  describe('edge cases', () => {
    it('handles non-string input gracefully', () => {
      // @ts-expect-error testing runtime guard
      expect(countText(null).success).toBe(false);
      // @ts-expect-error testing runtime guard
      expect(countText(undefined).success).toBe(false);
    });

    it('handles very large input', () => {
      const big = Array(10000).fill('word').join(' ');
      const r = countText(big);
      expect(r.success).toBe(true);
      expect(r.metadata?.words).toBe(10000);
    });

    it('produces a summary result string', () => {
      const r = countText('Hello world. Bye.');
      expect(r.result).toContain('words');
      expect(r.result).toContain('read');
    });
  });
});
