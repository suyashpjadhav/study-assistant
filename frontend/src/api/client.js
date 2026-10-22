const API = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

export async function pingServer(signal) {
  let res;
  try {
    res = await fetch(`${API}/health`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR', 'Network failure during health ping.', true);
  }

  if (!res.ok) {
    throw new ApiError('BAD_RESPONSE', 'Health check returned non-ok status.', true);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('BAD_RESPONSE', 'Health check response is not valid JSON.', true);
  }

  if (!body || body.ok !== true) {
    throw new ApiError('BAD_RESPONSE', 'Health check payload was not ok.', true);
  }

  return true;
}

export async function generateStudyMaterial(notes, signal) {
  let res;
  try {
    res = await fetch(`${API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR', 'Network connection failed. Please check your connection.', true);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('BAD_RESPONSE', 'Server returned invalid JSON.', true);
  }

  // Handle failure payloads from backend
  if (!res.ok || body?.ok === false) {
    const err = body?.error || {};
    throw new ApiError(
      err.code || 'BAD_RESPONSE',
      err.message || 'An error occurred while generating study material.',
      err.retryable ?? true
    );
  }

  // Validate success shape strictly
  const { data, warnings } = body;
  const isInvalidShape =
    !data ||
    typeof data !== 'object' ||
    typeof data.title !== 'string' ||
    !Array.isArray(data.flashcards) ||
    !Array.isArray(data.quiz) ||
    !Array.isArray(warnings);

  if (isInvalidShape) {
    throw new ApiError('BAD_RESPONSE', 'Server returned an invalid data structure.', true);
  }

  return { data, warnings };
}
