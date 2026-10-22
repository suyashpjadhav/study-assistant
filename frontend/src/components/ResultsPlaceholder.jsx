export function ResultsPlaceholder({ data, warnings = [], onNewNotes, onEditNotes }) {
  const flashcardCount = data?.flashcards?.length ?? 0;
  const quizCount = data?.quiz?.length ?? 0;

  const hasFlashcardWarning = warnings.includes('FLASHCARDS_UNAVAILABLE');
  const hasQuizWarning = warnings.includes('QUIZ_UNAVAILABLE');

  return (
    <div className="card results-card">
      <div className="results-header">
        <span className="results-badge">Study Set Ready</span>
        <h2 className="results-title">{data?.title || 'Study Material'}</h2>
        <p className="results-meta">
          {flashcardCount} flashcards — {quizCount} quiz questions
        </p>
      </div>

      {(hasFlashcardWarning || hasQuizWarning) && (
        <div className="results-warnings" role="status">
          {hasFlashcardWarning && (
            <p className="warning-item">
              Notice: Flashcards could not be fully generated from the provided notes.
            </p>
          )}
          {hasQuizWarning && (
            <p className="warning-item">
              Notice: Quiz questions could not be fully generated from the provided notes.
            </p>
          )}
        </div>
      )}

      <div className="results-preview-note">
        <p>Full interactive flashcards and quiz viewer will be available in the next release.</p>
      </div>

      <div className="results-actions">
        <button type="button" className="btn btn-primary" onClick={onNewNotes}>
          New notes
        </button>
        {onEditNotes && (
          <button type="button" className="btn btn-secondary" onClick={onEditNotes}>
            Edit notes
          </button>
        )}
      </div>
    </div>
  );
}
