// NOTE: Keep this validation logic in sync with backend/src/inputCheck.js

/**
 * Validates study notes before calling OpenAI.
 *
 * @param {string} text - Raw input text from the user.
 * @returns {{ ok: true } | { ok: false, reason: string, message: string, hint: string }}
 */
export function checkNotes(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';

  // Rule 1: Language-friendly word count
  // If the text contains CJK characters (Han, Hiragana, Katakana, Hangul),
  // skip the word rule and require at least 10 CJK characters. Otherwise require at least 6 words.
  const cjkMatches = trimmed.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

  if (cjkCount > 0) {
    if (cjkCount < 10) {
      return {
        ok: false,
        reason: 'TOO_FEW_WORDS',
        message: "These notes don't look like study material yet.",
        hint: 'Add a few full sentences or at least 10 characters about the topic.',
      };
    }
  } else {
    if (words.length < 6) {
      return {
        ok: false,
        reason: 'TOO_FEW_WORDS',
        message: "These notes don't look like study material yet.",
        hint: 'Add a few full sentences about the topic.',
      };
    }
  }

  // Rule 2: At least 50% of non-whitespace characters must be letters or digits (\p{L}, \p{N}, or \p{M}, with u flag)
  const nonWhitespaceMatches = trimmed.match(/\S/gu);
  const totalNonWs = nonWhitespaceMatches ? nonWhitespaceMatches.length : 0;
  const letterOrDigitMatches = trimmed.match(/[\p{L}\p{N}\p{M}]/gu);
  const letterOrDigitCount = letterOrDigitMatches ? letterOrDigitMatches.length : 0;

  if (totalNonWs === 0 || (letterOrDigitCount / totalNonWs) < 0.5) {
    return {
      ok: false,
      reason: 'TOO_MANY_SYMBOLS',
      message: 'Too many symbols or punctuation marks were detected.',
      hint: 'Add more descriptive text or explanations alongside symbols and formulas.',
    };
  }

  // Rule 3: Repetitive text check
  // If there are at least 6 words and unique words (case-insensitive) are fewer than 30% of all words, reject.
  if (words.length >= 6) {
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if ((uniqueWords.size / words.length) < 0.3) {
      return {
        ok: false,
        reason: 'REPETITIVE',
        message: 'The notes appear repetitive with very few distinct words.',
        hint: 'Add more varied notes covering different concepts.',
      };
    }
  }

  return { ok: true };
}
