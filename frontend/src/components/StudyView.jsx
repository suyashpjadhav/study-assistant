import { useState, useEffect } from 'react';
import { FlashcardDeck } from './FlashcardDeck.jsx';
import { QuizRunner } from './QuizRunner.jsx';

export function StudyView({ data, notes, onEditNotes, onNewNotes, onRegenerate }) {
  const flashcardCount = data?.flashcards?.length ?? 0;
  const quizCount = data?.quiz?.length ?? 0;
  const hasFlashcards = flashcardCount > 0;
  const hasQuiz = quizCount > 0;

  // Default to the tab that has content (Flashcards if both or only Flashcards exist,
  // Quiz if only Quiz exists) and automatically switch away if the active tab's content
  // becomes unavailable (e.g. after Regenerate) so the user is never stuck on an empty tab.
  const [activeTab, setActiveTab] = useState(() => {
    if (hasFlashcards) return 'flashcards';
    if (hasQuiz) return 'quiz';
    return 'flashcards';
  });

  useEffect(() => {
    if (activeTab === 'flashcards' && !hasFlashcards && hasQuiz) {
      setActiveTab('quiz');
    } else if (activeTab === 'quiz' && !hasQuiz && hasFlashcards) {
      setActiveTab('flashcards');
    }
  }, [activeTab, hasFlashcards, hasQuiz]);

  return (
    <div className="study-view-container">
      <div className="study-view-header">
        <h2 className="study-view-title">{data?.title || 'Study Material'}</h2>
        <div className="study-view-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onEditNotes}
          >
            Edit notes
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNewNotes}
          >
            New notes
          </button>
        </div>
      </div>

      {!hasFlashcards && (
        <div className="study-notice-card" role="status">
          <p className="study-notice-title">Flashcards could not be generated for these notes.</p>
          <p className="study-notice-hint">Try Regenerate, or edit your notes.</p>
        </div>
      )}
      {!hasQuiz && (
        <div className="study-notice-card" role="status">
          <p className="study-notice-title">The quiz could not be generated for these notes.</p>
          <p className="study-notice-hint">Try Regenerate, or edit your notes.</p>
        </div>
      )}

      <div className="study-view-toggles" role="group" aria-label="Study modes">
        <button
          type="button"
          className={`btn ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={activeTab === 'flashcards'}
          disabled={!hasFlashcards}
          aria-disabled={!hasFlashcards}
          onClick={() => setActiveTab('flashcards')}
        >
          Flashcards ({flashcardCount})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={activeTab === 'quiz'}
          disabled={!hasQuiz}
          aria-disabled={!hasQuiz}
          onClick={() => setActiveTab('quiz')}
        >
          Quiz ({quizCount})
        </button>
      </div>

      {/* Keep both panels mounted and hide inactive one with hidden attribute to preserve progress */}
      <div className="study-panel" hidden={activeTab !== 'flashcards'}>
        {hasFlashcards ? (
          <FlashcardDeck flashcards={data.flashcards} />
        ) : (
          <div className="card empty-panel-card">
            <p className="empty-message">This set couldn't be generated.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRegenerate}
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="study-panel" hidden={activeTab !== 'quiz'}>
        {hasQuiz ? (
          <QuizRunner
            quiz={data.quiz}
            onBackToFlashcards={hasFlashcards ? () => setActiveTab('flashcards') : null}
          />
        ) : (
          <div className="card empty-panel-card">
            <p className="empty-message">This set couldn't be generated.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRegenerate}
            >
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
