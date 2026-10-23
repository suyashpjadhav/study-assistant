import { useEffect, useRef } from 'react';
import { useQuizSession } from '../hooks/useQuizSession.js';

function ResultsBanner({ round, percentage, correctCount, totalQuestions, wrongCount }) {
  let title = '';
  let line = '';
  let burstCount = 0;
  let ringColor = 'var(--yellow)';

  if (round === 1) {
    if (percentage === 100) {
      title = 'Flawless';
      line = 'Not a single slip. Take a bow.';
      ringColor = 'var(--teal)';
      burstCount = 14;
    } else if (percentage >= 75) {
      title = 'Sharp work';
      line = 'Most of it is locked in. Just a few to tidy up.';
      ringColor = 'var(--yellow)';
      burstCount = 10;
    } else if (percentage >= 50) {
      title = 'Solid start';
      line = 'You are past halfway. The missed ones are next.';
      ringColor = 'var(--yellow)';
      burstCount = 6;
    } else {
      title = 'Good first pass';
      line = 'Now you know what to focus on. Try the retest.';
      ringColor = 'var(--orange)';
      burstCount = 0;
    }
  } else {
    // round > 1
    if (wrongCount === 0) {
      title = 'Mistakes fixed';
      line = 'Everything from last round is right now.';
      ringColor = 'var(--teal)';
      burstCount = 6;
    } else {
      title = 'Round done';
      line = `${correctCount} of ${totalQuestions} fixed this round.`;
      ringColor = 'var(--yellow)';
      burstCount = 0;
    }
  }

  let icon = null;
  if (percentage === 100 || (round > 1 && wrongCount === 0)) {
    icon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  } else if (percentage >= 75) {
    icon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  } else if (percentage >= 50) {
    icon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  } else {
    icon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }

  const RING_RADIUS = 40;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~251.33
  const targetOffset = Number(
    (RING_CIRCUMFERENCE * (1 - (totalQuestions > 0 ? correctCount / totalQuestions : 0))).toFixed(2)
  );

  return (
    <div className="results-banner-area">
      <div className="quiz-ring-wrapper">
        <svg
          className="quiz-ring-svg"
          width="100"
          height="100"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            className="quiz-ring-bg"
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="quiz-ring-circle"
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ '--target-offset': targetOffset }}
          />
        </svg>
        <span className="quiz-ring-label" aria-hidden="true">
          {percentage}%
        </span>
        {burstCount > 0 && (
          <div className="quiz-ring-burst" aria-hidden="true">
            {Array.from({ length: burstCount }, (_, i) => (
              <span
                key={i}
                className="quiz-burst-dot"
                style={{
                  '--angle': `${(360 / burstCount) * i}deg`,
                  backgroundColor: ringColor,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="results-tier-card" role="status">
        <div className="tier-icon-wrap" aria-hidden="true" style={{ color: ringColor }}>
          {icon}
        </div>
        <div className="tier-text-wrap">
          <h3 className="tier-title">{title}</h3>
          <p className="tier-line">{line}</p>
        </div>
      </div>
    </div>
  );
}

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
    const isFlawless = round === 1 && percentage === 100;

    return (
      <div className={`card quiz-card quiz-results-card ${isFlawless ? 'card-shine' : ''}`.trim()}>
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

          <ResultsBanner
            round={round}
            percentage={percentage}
            correctCount={correctCount}
            totalQuestions={totalQuestions}
            wrongCount={wrongCount}
          />

          <p className="quiz-score-summary">
            Score: <strong>{correctCount} / {totalQuestions}</strong> ({percentage}%)
          </p>
        </div>

        {wrongCount > 0 && (
          <div className="tea-time-container">
            <div className="tea-time-header">
              <h3 className="tea-time-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" y1="2" x2="6" y2="4" />
                  <line x1="10" y1="2" x2="10" y2="4" />
                  <line x1="14" y1="2" x2="14" y2="4" />
                </svg>
                <span>Tea Time</span>
              </h3>
              <p className="tea-time-subtitle">
                The ones that got you, and the real story. ({wrongCount})
              </p>
            </div>

            <div className="tea-time-list">
              {wrongQuestions.map((q, itemIndex) => {
                const answerRecord = answers[q.id];
                const userChoice =
                  answerRecord && answerRecord.selected !== null
                    ? q.options[answerRecord.selected]
                    : 'Skipped';
                const correctChoice = q.options[q.correctIndex];

                return (
                  <div
                    key={q.id}
                    className="tea-item-card"
                    style={{ '--delay': `${Math.min(itemIndex * 90, 600)}ms` }}
                  >
                    <p className="tea-item-question">{q.question}</p>
                    <div className="tea-item-details">
                      <p className="tea-user-choice">
                        <span className="tea-label">You said:</span> {userChoice}
                      </p>
                      <p className="tea-correct-choice">
                        <span className="tea-label">Plot twist:</span> {correctChoice}
                      </p>
                      {q.explanation && (
                        <p className="tea-explanation">
                          <span className="tea-label">The tea:</span> {q.explanation}
                        </p>
                      )}
                    </div>
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

      <div className="quiz-stage" key={`${round}-${currentQ.id}`}>
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
            let icon = null;

            if (phase === 'feedback') {
              const isCorrectOption = optIndex === currentQ.correctIndex;
              const isUserSelection = optIndex === selected;

              if (isCorrectOption) {
                btnClass += ' option-correct';
                badgeLabel = 'Correct';
                icon = (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="option-icon option-icon-check"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                );
              } else if (isUserSelection) {
                btnClass += ' option-wrong';
                badgeLabel = 'Not quite';
                icon = (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="option-icon option-icon-cross"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                );
              } else {
                btnClass += ' option-dimmed';
              }
            }

            return (
              <button
                key={optIndex}
                type="button"
                className={btnClass}
                style={{ '--i': optIndex }}
                disabled={phase !== 'answering'}
                onClick={() => dispatch({ type: 'SELECT', payload: optIndex })}
              >
                <span className="option-text">
                  {icon && <span className="option-icon-wrap">{icon}</span>}
                  {optionText}
                </span>
                {badgeLabel && (
                  <span className="option-state-badge">{badgeLabel}</span>
                )}
              </button>
            );
          })}
        </div>
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
