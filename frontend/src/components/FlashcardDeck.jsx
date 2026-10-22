import { useState, useMemo, useEffect } from 'react';

const ACCENT_VARS = [
  'var(--yellow)',
  'var(--orange)',
  'var(--teal)',
  'var(--pink)',
];

export function FlashcardDeck({ flashcards = [] }) {
  const [deck, setDeck] = useState(flashcards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(() => new Set());
  const [isSummary, setIsSummary] = useState(false);

  // Sync deck when initial flashcards prop changes
  useEffect(() => {
    setDeck(flashcards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setIsSummary(false);
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
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const handleMark = (isKnown) => {
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
    setDeck(missedCards);
    setIndex(0);
    setFlipped(false);
    setIsSummary(false);
  };

  const handleRestartAll = () => {
    setDeck(flashcards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setIsSummary(false);
  };

  if (isSummary) {
    return (
      <div className="card deck-summary-card">
        <div className="summary-header">
          <span className="summary-badge">Summary</span>
          <h2 className="summary-title">Flashcard Review Complete</h2>
          <p className="summary-score">
            {knownCount} of {totalFullDeck} known
          </p>
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

      <div className="flashcard-wrapper">
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
          Still learning
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleMark(true)}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
