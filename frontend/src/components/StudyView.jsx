import { useState } from 'react';
import { FlashcardDeck } from './FlashcardDeck.jsx';
import { QuizRunner } from './QuizRunner.jsx';

export function StudyView({ data, notes, onEditNotes, onNewNotes, onRegenerate }) {
  const flashcardCount = data?.flashcards?.length ?? 0;
  const quizCount = data?.quiz?.length ?? 0;
  const hasFlashcards = flashcardCount > 0;
  const hasQuiz = quizCount > 0;

  // Default to the first non-empty set
  const [activeTab, setActiveTab] = useState(() => {
    if (hasFlashcards) return 'flashcards';
    if (hasQuiz) return 'quiz';
    return 'flashcards';
  });

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

      <div className="study-view-toggles" role="group" aria-label="Study modes">
        <button
          type="button"
          className={`btn ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={activeTab === 'flashcards'}
          onClick={() => setActiveTab('flashcards')}
        >
          Flashcards ({flashcardCount})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={activeTab === 'quiz'}
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
            onBackToFlashcards={() => setActiveTab('flashcards')}
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
