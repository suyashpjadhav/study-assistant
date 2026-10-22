export class AppError extends Error {
  constructor(code, message, { retryable = false, details } = {}) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}