import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { AppError } from './errors.js';
import { generateStudyMaterial } from './generate.js';
import { checkNotes } from './inputCheck.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: '50kb' }));

// Health check registered before rate limiter
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Rate limiter: 20 requests per minute per IP for /api routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('RATE_LIMITED', 'Too many requests, please try again later.', { retryable: true }));
  },
});

app.use('/api', apiLimiter);

app.post('/api/generate', async (req, res, next) => {
  try {
    const { notes } = req.body || {};
    if (typeof notes !== 'string') {
      throw new AppError('INVALID_INPUT', 'Field "notes" must be a string.', { retryable: false });
    }

    const trimmed = notes.trim();
    if (trimmed.length < 20 || trimmed.length > 8000) {
      throw new AppError('INVALID_INPUT', 'Notes must be between 20 and 8000 characters.', { retryable: false });
    }

    const check = checkNotes(trimmed);
    if (!check.ok) {
      throw new AppError('INVALID_INPUT', check.message, { retryable: false });
    }

    const { data, warnings } = await generateStudyMaterial(trimmed);
    res.status(200).json({ ok: true, data, warnings });
  } catch (err) {
    next(err);
  }
});

// Central error handler
app.use((err, req, res, next) => {
  // Handle express.json malformed JSON errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Malformed request JSON.',
        retryable: false,
      },
    });
  }

  // Handle known application errors
  if (err instanceof AppError) {
    let status = 502;
    if (err.code === 'INVALID_INPUT') {
      status = 400;
    } else if (err.code === 'NOT_STUDYABLE') {
      status = 422;
    } else if (err.code === 'RATE_LIMITED') {
      status = 429;
    } else if (err.code === 'TIMEOUT') {
      status = 504;
    }

    return res.status(status).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        retryable: err.retryable,
      },
    });
  }

  // Handle generic unknown errors without leaking stack traces
  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
      retryable: false,
    },
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
