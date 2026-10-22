# Study Assistant

Pasted notes -> flashcards + quiz, structured JSON from an LLM, not a chatbot.

## Setup

- Prerequisites: Node.js 18+
- Copy the environment template:
  ```cmd
  copy backend\.env.example backend\.env
  ```
- Add your own OpenAI API key to `backend/.env`:
  ```env
  OPENAI_API_KEY=your-api-key-here
  ```
- Install dependencies and start both backend and frontend from the repository root:
  ```cmd
  npm install && npm start
  ```
- Frontend runs at [http://localhost:5173](http://localhost:5173), backend runs on port 3001.

## Usage

1. Paste notes (20-8000 chars) or click "Try sample notes".
2. Click "Generate" to create materials.
3. Flip flashcards (mark "Got it" / "Still learning", and use "Review missed").
4. Take the quiz with instant feedback and explanations.
5. Use "Retest wrong answers" to practice missed questions.

## Architecture

Study Assistant uses an Express backend to generate structured study materials from arbitrary notes, keeping the OpenAI API key secure on the server. The browser issues a POST request to Express, which queries OpenAI using `gpt-4o-mini` with strict Structured Outputs schema enforcement. The model output is parsed and strictly validated with Zod before returning to the frontend client.

### Request Flow
`browser -> POST /api/generate -> Express -> OpenAI gpt-4o-mini, Structured Outputs -> Zod validation -> response`

The OpenAI API key remains server-side at all times.

### Project Structure

#### backend/src
- `errors.js`: Custom AppError class with error codes and retry flags.
- `jsonSchema.js`: Strict JSON schema supplied to OpenAI for structured output.
- `validate.js`: Zod schema and per-item validation logic for study materials.
- `generate.js`: OpenAI prompt, structured completion call, and automatic single retry.
- `index.js`: Express server setup, rate limiting, and `/api/generate` route handler.

#### frontend/src
- `api/client.js`: HTTP request client with timeout handling, cancellation, and error translation.
- `hooks/useGenerate.js`: Generation state management with stale-request tracking and cancellation.
- `hooks/useQuizSession.js`: Reducer managing quiz answers, scores, and wrong-answer retesting.
- `hooks/useServerWarmup.js`: Background health check to wake idle backend instances.
- `components/InputForm`: Notes input form with character limits and sample notes loader.
- `components/Loading`: Loading indicator with timed server wake-up notice.
- `components/ErrorBanner`: Error alert displaying error messages with retry and edit actions.
- `components/EmptyState`: Fallback display when generated sets are empty.
- `components/StudyView`: Main view managing tab navigation between flashcards and quiz.
- `components/FlashcardDeck`: Card flip deck with mastery tracking and missed-card review.
- `components/QuizRunner`: Interactive quiz interface with explanations and retest flow.

## Handling Bad AI Output

- JSON schema steers the model, Zod is the real gate.
- Per-item validation keeps partial results (minimum 3 accepted per set).
- One automatic retry with a corrective message if generation fails.
- Stale-response guard using a request-id ref and AbortController.
- 60-second client timeout on network requests.
- 8-second "Waking up the server..." message for cold starts.
- Structured error codes with a retry/edit-notes banner.

## AI Usage (Honest)

- Antigravity agent wrote most of the code.
- Claude was used for planning, prompts and review.
- I reviewed and manually tested everything, including simulated failures (bad JSON, wrong shape, one bad item, empty quiz, slow, fake key, backend off, cancel).

## Known Limitations

- Validator checks structure, not factual quality; distractors can be ambiguous.
- A set may have fewer than 8 flashcards / 6 questions (minimum 3 accepted).
- Regenerate re-runs everything and resets progress in both sets.
- No persistence, no streaming, dark theme only.

## What I'd Do Next

- Server-side error logging (status code and error code, never the key or notes); today an OpenAI 401/429 leaves no trace.
- Separate non-retryable code for a bad API key, and hide the retry button for it.
- "Can't reach the server" message when the backend is down (currently shows BAD_RESPONSE wording).
- Unit tests for the validator and the quiz reducer.
- Persist sessions, shuffle quiz options, keyboard shortcuts.
