import { useState, useMemo, useEffect } from 'react';

const ACCENT_VARS = [
  'var(--yellow)',
  'var(--orange)',
  'var(--teal)',
  'var(--pink)',
];

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~276.46

export function FlashcardDeck({ flashcards = [] }) {
  const [deck, setDeck] = useState(flashcards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(() => new Set());
  const [isSummary, setIsSummary] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  // Sync deck when initial flashcards prop changes
  useEffect(() => {
    setDeck(flashcards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setIsSummary(false);
    setLastAction(null);
  }, [flashcards]);

  // Stable index map from original flashcards array for stable colors across review rounds
  const originalIndexMap = useMemo(() => {
    const map = new Map();
    flashcards.forEach((card, i) => map.set(card.id, i));
    return map;
  }, [flashcards]);

  if (!deck || deck.length === 0) {
    return (
      <div className="card deck-card">
        <p className="empty-message">No flashcards available in this set.</p>
      </div>
    );
  }

  const currentCard = deck[index] || deck[0];
  const origIndex = originalIndexMap.get(currentCard.id) ?? index;
  const accentColor = ACCENT_VARS[origIndex % ACCENT_VARS.length];

  const totalFullDeck = flashcards.length;
  const knownCount = known.size;
  const missedCards = flashcards.filter((card) => !known.has(card.id));
  const missedCount = missedCards.length;

  const handleCardClick = () => {
    setFlipped((f) => !f);
  };

  const handlePrev = () => {
    if (index > 0) {
      setLastAction('prev');
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (index < deck.length - 1) {
      setLastAction('next');
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const handleMark = (isKnown) => {
    setLastAction(isKnown ? 'known' : 'learning');
    const nextKnown = new Set(known);
    if (isKnown) {
      nextKnown.add(currentCard.id);
    } else {
      nextKnown.delete(currentCard.id);
    }
    setKnown(nextKnown);

    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      // Reached the end of this round's deck
      setIsSummary(true);
      setFlipped(false);
    }
  };

  const handleReviewMissed = () => {
    setLastAction(null);
    setDeck(missedCards);
    setIndex(0);
    setFlipped(false);
    setIsSummary(false);
  };

  const handleRestartAll = () => {
    setLastAction(null);
    setDeck(flashcards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setIsSummary(false);
  };

  if (isSummary) {
    const missedRatio = totalFullDeck > 0 ? missedCount / totalFullDeck : 0;
    let feedbackTitle = '';
    let feedbackLine = '';
    if (missedCount === 0) {
      feedbackTitle = 'Deck cleared';
      feedbackLine = 'Every card is locked in.';
    } else if (missedRatio <= 0.25) {
      feedbackTitle = 'Almost there';
      feedbackLine = 'Just a few left. One more pass will do it.';
    } else if (missedRatio <= 0.6) {
      feedbackTitle = 'Getting there';
      feedbackLine = 'Good start. The missed ones will stick on the next round.';
    } else {
      feedbackTitle = 'Fresh start';
      feedbackLine = 'This is what review rounds are for. Go again.';
    }

    const targetOffset = Number(
      (RING_CIRCUMFERENCE * (1 - (totalFullDeck > 0 ? knownCount / totalFullDeck : 0))).toFixed(2)
    );
    const isCleared = missedCount === 0;

    return (
      <div className="card deck-summary-card">
        <div className="summary-header">
          <span className="summary-badge">Summary</span>
          <h2 className="summary-title">Flashcard Review Complete</h2>

          <div className="summary-ring-wrapper">
            <svg
              className="progress-ring-svg"
              width="110"
              height="110"
              viewBox="0 0 110 110"
              aria-hidden="true"
            >
              <circle
                className="progress-ring-bg"
                cx="55"
                cy="55"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="progress-ring-circle"
                cx="55"
                cy="55"
                r={RING_RADIUS}
                fill="none"
                stroke={isCleared ? 'var(--teal)' : 'var(--yellow)'}
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ '--target-offset': targetOffset }}
              />
            </svg>
            <span className="progress-ring-label" aria-hidden="true">
              {totalFullDeck > 0 ? Math.round((knownCount / totalFullDeck) * 100) : 0}%
            </span>
            {isCleared && (
              <div className="ring-burst" aria-hidden="true">
                <span className="burst-dot dot-0" />
                <span className="burst-dot dot-1" />
                <span className="burst-dot dot-2" />
                <span className="burst-dot dot-3" />
                <span className="burst-dot dot-4" />
                <span className="burst-dot dot-5" />
                <span className="burst-dot dot-6" />
                <span className="burst-dot dot-7" />
              </div>
            )}
          </div>

          <p className="summary-score">
            {knownCount} of {totalFullDeck} known
          </p>

          <div className="summary-status-block" role="status">
            <h3 className="summary-feedback-title">{feedbackTitle}</h3>
            <p className="summary-feedback-line">{feedbackLine}</p>
          </div>
        </div>

        <div className="summary-actions">
          {missedCount > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReviewMissed}
            >
              Review missed ({missedCount})
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRestartAll}
          >
            Restart all
          </button>
        </div>
      </div>
    );
  }

  const actionClass = lastAction ? `enter-${lastAction}` : '';

  return (
    <div className="card deck-card">
      <div className="deck-nav">
        <span className="deck-progress">
          {index + 1} / {deck.length}
        </span>
        <div className="deck-nav-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrev}
            disabled={index === 0}
            aria-label="Previous card"
          >
            Prev
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNext}
            disabled={index === deck.length - 1}
            aria-label="Next card"
          >
            Next
          </button>
        </div>
      </div>

      <div
        key={currentCard.id}
        className={`flashcard-wrapper ${actionClass}`.trim()}
      >
        <button
          key={currentCard.id}
          type="button"
          className="flashcard-btn"
          aria-pressed={flipped}
          onClick={handleCardClick}
          aria-label={flipped ? 'Flashcard back. Tap to show front.' : 'Flashcard front. Tap to show back.'}
        >
          <span
            className="card-face card-front"
            aria-hidden={flipped ? 'true' : 'false'}
            style={{ backgroundColor: accentColor, color: 'var(--on-accent)' }}
          >
            <span className="card-face-hint">Tap to flip • Prompt</span>
            <span className="card-face-text">{currentCard.front}</span>
          </span>

          <span
            className="card-face card-back"
            aria-hidden={flipped ? 'false' : 'true'}
          >
            <span className="card-face-hint">Tap to flip • Answer</span>
            <span className="card-face-text">{currentCard.back}</span>
          </span>
        </button>
      </div>

      <div className="deck-controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleMark(false)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Still learning</span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleMark(true)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Got it</span>
        </button>
      </div>
    </div>
  );
}
