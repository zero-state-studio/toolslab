export interface WordCounterStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Estimated reading time in seconds (silent reading). */
  readingTimeSeconds: number;
  /** Estimated speaking time in seconds (read aloud). */
  speakingTimeSeconds: number;
  /** Human-readable reading time, e.g. "2 min 15 sec". */
  readingTime: string;
  /** Human-readable speaking time. */
  speakingTime: string;
}

export interface WordCounterOptions {
  /** Words per minute for silent reading. Default 200. */
  readingWpm?: number;
  /** Words per minute for speaking aloud. Default 130. */
  speakingWpm?: number;
}

export interface WordCounterResult {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: WordCounterStats;
}

const DEFAULT_READING_WPM = 200;
const DEFAULT_SPEAKING_WPM = 130;

/** Format a duration in seconds to a compact human string. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 1) return '0 sec';
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes === 0) return `${rem} sec`;
  if (rem === 0) return `${minutes} min`;
  return `${minutes} min ${rem} sec`;
}

/**
 * Count words, characters, sentences, paragraphs, lines and estimate
 * reading/speaking time for a block of text. Pure, runs in the browser.
 */
export function countText(
  input: string,
  options: WordCounterOptions = {}
): WordCounterResult {
  try {
    if (typeof input !== 'string') {
      return { success: false, error: 'Input required' };
    }

    const readingWpm = options.readingWpm ?? DEFAULT_READING_WPM;
    const speakingWpm = options.speakingWpm ?? DEFAULT_SPEAKING_WPM;

    // Characters: count Unicode code points so emoji/surrogate pairs count as 1.
    const characters = Array.from(input).length;
    const charactersNoSpaces = Array.from(input.replace(/\s/g, '')).length;

    // Words: split on any whitespace run, drop empties.
    const trimmed = input.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

    // Sentences: terminators . ! ? … (collapse repeats like "?!" or "...").
    const sentenceMatches = trimmed.match(/[^.!?…]+[.!?…]+(\s|$)/g);
    let sentences = sentenceMatches ? sentenceMatches.length : 0;
    // Trailing text with no terminator still counts as one sentence.
    if (trimmed.length > 0 && !/[.!?…]\s*$/.test(trimmed)) {
      sentences += 1;
    }

    // Paragraphs: blocks separated by one or more blank lines.
    const paragraphs =
      trimmed.length === 0
        ? 0
        : trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

    // Lines: number of newline-separated rows (empty input = 0).
    const lines = input.length === 0 ? 0 : input.split(/\n/).length;

    const readingTimeSeconds = (words / readingWpm) * 60;
    const speakingTimeSeconds = (words / speakingWpm) * 60;

    const metadata: WordCounterStats = {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      lines,
      readingTimeSeconds,
      speakingTimeSeconds,
      readingTime: formatDuration(readingTimeSeconds),
      speakingTime: formatDuration(speakingTimeSeconds),
    };

    const result =
      `${words} words, ${characters} characters, ${sentences} sentences, ` +
      `${paragraphs} paragraphs — ${metadata.readingTime} read`;

    return { success: true, result, metadata };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
