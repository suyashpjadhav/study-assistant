export function EmptyState({ onEditNotes }) {
  return (
    <div className="card empty-card" role="status">
      <div className="empty-icon" aria-hidden="true">📝</div>
      <h2>No Study Material Generated</h2>
      <p className="empty-message">
        Not enough content was generated. Try adding more detailed notes.
      </p>
      <div className="empty-actions">
        <button type="button" className="btn btn-primary" onClick={onEditNotes}>
          Edit notes
        </button>
      </div>
    </div>
  );
}
