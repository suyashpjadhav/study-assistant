import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { AppError } from './errors.js';

const MIN_ITEMS = 3;

const Envelope = z.object({
  title: z.string().trim().min(1),
  flashcards: z.array(z.unknown()),
  quiz: z.array(z.unknown()),
});
const Flashcard = z.object({
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
});
const QuizItem = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim(),
});

// validates each item on its own, so one bad item doesn't discard the rest
function keepValid(items, schema, extraCheck = () => true) {
  const good = [];
  for (const item of items) {
    const r = schema.safeParse(item);
    if (r.success && extraCheck(r.data)) good.push({ id: randomUUID(), ...r.data });
  }
  return good;
}

const hasUniqueOptions = (q) =>
  new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length;

export function validateStudyMaterial(rawText) {
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new AppError('INVALID_JSON', 'Model returned malformed JSON', { retryable: true });
  }

  const env = Envelope.safeParse(json);
  if (!env.success) {
    throw new AppError('BAD_SHAPE', 'Model returned the wrong shape', {
      retryable: true,
      details: env.error.issues.slice(0, 5),
    });
  }

  const warnings = [];
  let flashcards = keepValid(env.data.flashcards, Flashcard);
  let quiz = keepValid(env.data.quiz, QuizItem, hasUniqueOptions);

  if (flashcards.length < MIN_ITEMS && quiz.length < MIN_ITEMS) {
    throw new AppError('TOO_FEW_ITEMS', 'Not enough usable content was generated', { retryable: true });
  }
  if (flashcards.length < MIN_ITEMS) { flashcards = []; warnings.push('FLASHCARDS_UNAVAILABLE'); }
  if (quiz.length < MIN_ITEMS) { quiz = []; warnings.push('QUIZ_UNAVAILABLE'); }

  return { data: { title: env.data.title, flashcards, quiz }, warnings };
}