function getErrorMessage(error) {
  const code = error?.code;
  switch (code) {
    case 'RATE_LIMITED':
      return "You've hit the rate limit. Please wait a minute before trying again.";
    case 'TIMEOUT':
    case 'CLIENT_TIMEOUT':
      return 'The request took too long to complete. Please try again.';
    case 'NETWORK_ERROR':
      return 'Could not connect to the server. Please check your network connection.';
    case 'BAD_RESPONSE':
      return 'Received an unexpected response from the server. Please try again.';
    case 'INVALID_JSON':
    case 'BAD_SHAPE':
    case 'TOO_FEW_ITEMS':
      return 'The AI returned unusable content. Please try again or provide more detailed notes.';
    case 'REFUSAL':
      return 'The AI model could not process these notes. Please ensure they contain appropriate study material.';
    case 'UPSTREAM_ERROR':
      return 'The AI service encountered an error. Please try again shortly.';
    case 'INVALID_INPUT':
      return 'Please review your notes (they must be between 20 and 8,000 characters).';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
}

export function ErrorBanner({ error, onRetry, onEditNotes }) {
  const message = getErrorMessage(error);
  const isRetryable = error?.retryable ?? false;

  return (
    <div className="card error-card" role="alert">
      <div className="error-header">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <h2 className="error-title">Generation Error</h2>
      </div>

      <p className="error-message">{message}</p>

      {error?.code && (
        <span className="error-code-badge">
          Error code: {error.code}
        </span>
      )}

      <div className="error-actions">
        {isRetryable && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
        )}
        <button
          type="button"
          className={isRetryable ? 'btn btn-secondary' : 'btn btn-primary'}
          onClick={onEditNotes}
        >
          Edit notes
        </button>
      </div>
    </div>
  );
}
