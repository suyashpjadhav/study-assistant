import { useEffect, useRef } from 'react';
import { useQuizSession } from '../hooks/useQuizSession.js';

export function QuizRunner({ quiz = [], onBackToFlashcards = null }) {
  const { state, dispatch } = useQuizSession(quiz);
  const { queue, round, index, selected, answers, phase } = state;

  const questionHeadingRef = useRef(null);
  const resultsHeadingRef = useRef(null);

  // Focus management: move focus to question heading on question change
  useEffect(() => {
    if (phase === 'answering' && questionHeadingRef.current) {
      questionHeadingRef.current.focus();
    }
  }, [index, phase]);

  // Focus management: move focus to results heading when quiz finishes
  useEffect(() => {
    if (phase === 'finished' && resultsHeadingRef.current) {
      resultsHeadingRef.current.focus();
    }
  }, [phase]);

  if (!queue || queue.length === 0) {
    return (
      <div className="card quiz-card">
        <p className="empty-message">No quiz questions available.</p>
      </div>
    );
  }

  const currentQ = queue[index];
  const totalQuestions = queue.length;
  const currentStep = index + 1;
  const progressPercent = Math.round((currentStep / totalQuestions) * 100);

  // Announcement text for persistent aria-live polite region
  let liveAnnouncement = '';
  if (phase === 'feedback' && currentQ) {
    const isCorrect = selected === currentQ.correctIndex;
    liveAnnouncement = isCorrect
      ? 'Correct.'
      : `Incorrect, the answer is ${currentQ.options[currentQ.correctIndex]}.`;
  } else if (phase === 'finished') {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    liveAnnouncement = `Quiz finished. Your score is ${correctCount} of ${totalQuestions}.`;
  }

  if (phase === 'finished') {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const wrongQuestions = queue.filter((q) => answers[q.id] && !answers[q.id].correct);
    const wrongCount = wrongQuestions.length;

    return (
      <div className="card quiz-card quiz-results-card">
        {/* Persistent live region for screen readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </div>

        <div className="results-header">
          <span className="results-badge">
            {round > 1 ? `Retest Round ${round} Complete` : 'Quiz Complete'}
          </span>
          <h2
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="results-heading focus-outline-none"
          >
            Your Results
          </h2>
          <p className="quiz-score-summary">
            Score: <strong>{correctCount} / {totalQuestions}</strong> ({percentage}%)
          </p>
        </div>

        {wrongCount === 0 ? (
          <div className="congrats-card">
            <span className="congrats-icon" aria-hidden="true">🎉</span>
            <p className="congrats-text">Outstanding! You answered every question correctly!</p>
          </div>
        ) : (
          <div className="wrong-answers-container">
            <h3 className="wrong-answers-title">Review Missed Questions ({wrongCount})</h3>
            <div className="wrong-answers-list">
              {wrongQuestions.map((q) => {
                const answerRecord = answers[q.id];
                const userChoice =
                  answerRecord && answerRecord.selected !== null
                    ? q.options[answerRecord.selected]
                    : 'Skipped';
                const correctChoice = q.options[q.correctIndex];

                return (
                  <div key={q.id} className="wrong-item-card">
                    <p className="wrong-item-question">{q.question}</p>
                    <div className="wrong-item-answers">
                      <p className="wrong-user-choice">
                        Your answer: <span>{userChoice}</span>
                      </p>
                      <p className="wrong-correct-choice">
                        Correct answer: <span>{correctChoice}</span>
                      </p>
                    </div>
                    {q.explanation && (
                      <p className="wrong-item-explanation">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="quiz-results-actions">
          {wrongCount > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'RETEST_WRONG' })}
            >
              Retest wrong answers ({wrongCount})
            </button>
          )}
          <button
            type="button"
            className={wrongCount > 0 ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={() => dispatch({ type: 'RESTART' })}
          >
            Retake all
          </button>
          {onBackToFlashcards && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToFlashcards}
            >
              Back to flashcards
            </button>
          )}
        </div>
      </div>
    );
  }

  const isLastQuestion = index === totalQuestions - 1;
  const nextButtonLabel = isLastQuestion ? 'See results' : 'Next';

  return (
    <div className="card quiz-card">
      {/* Persistent live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="quiz-top-bar">
        <div className="quiz-meta-info">
          <span className="quiz-step-label">
            Question {currentStep} of {totalQuestions}
          </span>
          {round > 1 && (
            <span className="retest-badge">Retest round {round}</span>
          )}
        </div>

        <div
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label="Quiz progress"
          className="quiz-progress-track"
        >
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="quiz-question-area">
        <h2
          ref={questionHeadingRef}
          tabIndex={-1}
          className="quiz-question-text focus-outline-none"
        >
          {currentQ.question}
        </h2>
      </div>

      <div className="quiz-options-grid" role="group" aria-label="Answer options">
        {currentQ.options.map((optionText, optIndex) => {
          let btnClass = 'quiz-option-btn';
          let badgeLabel = null;
          let glyph = null;

          if (phase === 'feedback') {
            const isCorrectOption = optIndex === currentQ.correctIndex;
            const isUserSelection = optIndex === selected;

            if (isCorrectOption) {
              btnClass += ' option-correct';
              badgeLabel = 'Correct';
              glyph = '✓ ';
            } else if (isUserSelection) {
              btnClass += ' option-wrong';
              badgeLabel = 'Not quite';
              glyph = '✕ ';
            } else {
              btnClass += ' option-dimmed';
            }
          }

          return (
            <button
              key={optIndex}
              type="button"
              className={btnClass}
              disabled={phase !== 'answering'}
              onClick={() => dispatch({ type: 'SELECT', payload: optIndex })}
            >
              <span className="option-text">
                {glyph && <span aria-hidden="true">{glyph}</span>}
                {optionText}
              </span>
              {badgeLabel && (
                <span className="option-state-badge">{badgeLabel}</span>
              )}
            </button>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div className="quiz-feedback-box">
          <p className="quiz-explanation">
            <strong>Explanation:</strong> {currentQ.explanation}
          </p>
          <div className="quiz-next-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'NEXT' })}
            >
              {nextButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
