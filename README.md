# Study Assistant

Pasted notes -> flashcards + quiz, structured JSON from an LLM.

- Live app: [https://study-assistant-p5tt.vercel.app](https://study-assistant-p5tt.vercel.app)

## Setup

- Prerequisites: Node.js 18.11+ (backend dev uses `node --watch`), Git, and an OpenAI API key.
- Clone the repo and go into the folder:
  ```bash
  git clone https://github.com/suyashpjadhav/study-assistant.git
  cd study-assistant
  ```
- Copy the environment template:
  ```cmd
  copy backend\.env.example backend\.env
  ```
  On macOS/Linux: `cp backend/.env.example backend/.env`

- Add your own OpenAI API key to `backend/.env`:
  ```env
  OPENAI_API_KEY=your-api-key-here
  ```
- Install dependencies and start both backend and frontend from the repository root:
  ```cmd
  npm install && npm start
  ```
- Open http://localhost:5173. The frontend runs there and the backend runs on port 3001.
- Environment variables:
  - Backend: `OPENAI_API_KEY` (required), `PORT` (default 3001), `ALLOWED_ORIGIN` (CORS origin; if unset, all origins are allowed, so set it to the frontend URL in production).
  - Frontend: `VITE_API_URL` (backend URL; empty in dev routes through the Vite proxy to localhost:3001, required in production when hosted on a different domain).

## Usage

1. Paste notes (20-8000 chars, at least 6 words) or click "Try sample notes".
2. Click "Generate Study Set" to create flashcards and quiz.
3. Flip flashcards (mark "Got it" / "Still learning", and use "Review missed").
4. Take the quiz with instant feedback and explanations.
5. Use "Retest wrong answers" to practice questions you got wrong.

## Architecture

Study Assistant uses an Express backend to generate structured study materials from arbitrary notes, keeping the OpenAI API key secure on the server. The browser issues a POST request to Express, which queries OpenAI using `gpt-4o-mini` with strict Structured Outputs schema enforcement. The model output is parsed and strictly validated with Zod before returning to the frontend client.

### Request Flow
`browser -> POST /api/generate -> Express -> OpenAI gpt-4o-mini, Structured Outputs -> Zod validation -> response`

The OpenAI API key remains server-side at all times and is never referenced in frontend code.

### Project Structure

#### backend/src
- `errors.js`: Custom AppError class with error codes and retry flags.
- `jsonSchema.js`: Strict JSON schema supplied to OpenAI for structured output.
- `validate.js`: Zod schema and per-item validation logic for study materials.
- `generate.js`: OpenAI prompt, structured completion call, and the retry logic.
- `inputCheck.js`: Fast heuristic input validation (length, word count, symbols, repetition) to reject invalid notes before making paid OpenAI API calls.
- `index.js`: Express server setup, in-memory rate limiting, and `/api/generate` route handler.

#### frontend/src
- `main.jsx`: React entry point rendering the root component into the DOM.
- `App.jsx`: Main application container coordinating input, loading, error, and study states.
- `index.css`: Design tokens, dark theme styles, card animations, and responsive utilities.
- `api/client.js`: HTTP request client with timeout handling, cancellation, and error translation.
- `hooks/useGenerate.js`: Generation state management with stale-request tracking and cancellation.
- `hooks/useQuizSession.js`: Reducer managing quiz answers, scores, and wrong-answer retesting.
- `hooks/useServerWarmup.js`: Background health check to wake idle backend instances.
- `utils/inputCheck.js`: Client-side input validation mirroring the backend gate.
- `components/InputForm.jsx`: Notes input form with character/word validation and sample notes loader.
- `components/Loading.jsx`: Loading indicator with skeleton cards, cancel button, and server wake notice.
- `components/ErrorBanner.jsx`: Error alert displaying error codes with retry and edit actions.
- `components/EmptyState.jsx`: Fallback display when generated sets are empty.
- `components/StudyView.jsx`: Study layout managing tab navigation between flashcards and quiz.
- `components/FlashcardDeck.jsx`: Card flip deck with mastery tracking and missed-card review.
- `components/QuizRunner.jsx`: Interactive quiz runner with score tiers, review cards for missed questions (with answers and explanations), and retest flow.

## Handling Bad AI Output

- JSON schema controls the model with strict mode (strict: true), while Zod serves as runtime schema validation before accepting responses.
- Per-item validation keeps partial results (minimum 3 accepted per set; target is 8 cards and 6 questions).
- Input gate rejects notes outside 20-8000 characters or under 6 words with `INVALID_INPUT` (400) before calling OpenAI.
- The model decides if notes are studyable via a boolean flag in the schema; if false, the backend throws `NOT_STUDYABLE` (422) and never retries.
- Retry once on validation failure with a corrective sentence naming the error code and message (never user notes or model output).
- If the first result is partial (flashcards or quiz missing), retry once and keep the retry only if it has strictly fewer warnings. Otherwise the first result is kept. If the retry throws, the first result is kept.
- Worst case is two OpenAI calls, 20s timeout each, 40s total, under the 60s client timeout.
- Stale-response guard using a request-id ref and AbortController discards outdated or cancelled responses.
- 60-second client timeout on network requests (`CLIENT_TIMEOUT`).
- 8-second "Waking up the server..." message for cold starts.
- Explicit loading (skeleton), error (actionable banner), and empty (edit prompt) states.
- Responsive mobile layout using viewport meta tag, 16px textarea font (no iOS zoom), and >= 48px touch targets.
- OpenAI errors are logged server-side (status and message) and the client receives a fixed message, preventing upstream leak.
- In-memory rate limiting on `/api` (20 requests per minute per IP), with `trust proxy` enabled for real client IPs on Render.

## AI Usage (Honest)

- Antigravity agent wrote most of the code.
- Claude was used for planning, prompts and review.
- I reviewed and manually tested everything, including simulated failures (bad JSON, wrong shape, one bad item, empty quiz, slow, fake key, backend off, cancel).
- The retry logic was tested by temporarily forcing a partial first result: retry accepted (2 calls, full set), retry rejected (first result kept), and gibberish notes (422, one call, no retry).

## Limitations

Grouped list below. The full version with future improvements is in the [LIMITATIONS_DOC](https://docs.google.com/document/d/1OIsvTaxjulS5GfRiI62TJU2WzaqGkTWZ8ffwSM5RqfA/edit?usp=sharing).

### AI output

- The validator checks structure (shape, counts, types), not whether the content is correct. A flashcard can be wrong and still pass. Quiz distractors can be ambiguous.
- A set can have fewer than 8 flashcards or 6 quiz questions. I accept a minimum of 3 per set so one bad item does not throw away the whole result. The UI shows a notice when a set is short or empty.
- The non-study check (`NOT_STUDYABLE`) works from a boolean flag the model returns in the schema, plus a simple input gate (length and word count). It can be wrong in both directions: reject a real note, or accept junk that looks like study material.

### Retry logic

- A retry is only accepted if it has strictly fewer warnings than the first result. If the counts are equal, the first result is kept. Example: the first result has only flashcards and the retry has only a quiz. Both have one warning, so the first is kept even though the retry is not worse.
- If the first OpenAI call fails or times out, there is no retry. Only validation failures and partial results are retried.
- When the partial-result retry throws, I catch everything and return the first result. That is the behaviour I wanted, but it also hides real bugs inside the retry code.
- The worst case is two OpenAI calls of 20 seconds each, so 40 seconds, which is under the 60 second client timeout.

### Frontend

- Disabling the quiz option buttons during the feedback phase makes keyboard focus drop to the page body.
- Regenerate runs everything again and resets progress in both flashcards and quiz.
- Dark theme only. No light mode.
- No persistence. Refreshing the page loses the generated set and the progress.
- No streaming. The user waits for the whole result.

### Hosting

- The backend runs on a free tier, so the first request after idle can take up to about a minute.
- Browsers like Brave can block the health ping, so the hint does not work there.

## Time Spent

About 7 h 55 min in total: 7 h 40 min of building plus 15 min of deployment.
- Time breakdown per feature: [TIME_LOG_DOC_LINK](https://docs.google.com/document/d/1Y_OmjNAmBAD8NFCIqV26ZbCnKfV-e6EorM7VTR1TT38/edit?usp=sharing)


## What I'd Do Next

- Log more on the server (timeouts, rate limits, validation failures), never the key or notes.
- Separate non-retryable code for a bad API key, and hide the retry button for it.
- Fix keyboard focus retention on quiz option selection during the feedback phase.
- Unit tests for the validator, the retry logic and the quiz reducer.
- Persist sessions, shuffle quiz options, keyboard shortcuts.
- Stream the result as it generates.