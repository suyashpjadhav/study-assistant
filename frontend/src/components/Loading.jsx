export function Loading({ onCancel, slow }) {
  return (
    <div className="card loading-card" aria-busy="true">
      <div className="loading-status">
        <div className="spinner" aria-hidden="true" />
        <h2>Generating your study set...</h2>
        {slow && (
          <p className="slow-notice">
            Waking up the server, this can take a minute
          </p>
        )}
      </div>

      <div className="skeleton-container" aria-hidden="true">
        <div className="skeleton-card">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-body" />
          <div className="skeleton-line skeleton-body short" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-body" />
          <div className="skeleton-line skeleton-body short" />
        </div>
      </div>

      <div className="loading-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
