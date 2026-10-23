import { useState } from 'react';
import { checkNotes } from '../utils/inputCheck.js';

const SAMPLE_NOTES =
  'Photosynthesis is the process used by plants, algae, and cyanobacteria to convert light ' +
  'energy into chemical energy stored in glucose. Using sunlight, water from the soil, and ' +
  'carbon dioxide from the air, chlorophyll inside plant chloroplasts synthesizes sugars ' +
  'while releasing oxygen as a byproduct. The process consists of light-dependent reactions ' +
  'that capture solar energy to produce ATP and NADPH, and the Calvin cycle (light-independent ' +
  'reactions) that fixes carbon dioxide into carbohydrates. These carbohydrates provide fuel ' +
  'for plant growth and form the foundation of Earth’s food chains.';

export function InputForm({ notes, onNotesChange, onSubmit, isLoading, isWarmupReady }) {
  const [notice, setNotice] = useState(null);

  const trimmed = notes.trim();
  const trimmedLength = trimmed.length;
  const isTooShort = trimmedLength < 20;
  const isTooLong = trimmedLength > 8000;
  const isDisabled = isTooShort || isTooLong || isLoading;

  let disabledReason = '';
  if (isTooShort && trimmedLength > 0) {
    disabledReason = `Needs at least 20 characters (${20 - trimmedLength} more needed)`;
  } else if (isTooShort && trimmedLength === 0) {
    disabledReason = 'Enter at least 20 characters to enable generation';
  } else if (isTooLong) {
    disabledReason = `Exceeds 8,000 characters (${trimmedLength - 8000} characters over)`;
  }

  const handleNotesChange = (val) => {
    if (notice) {
      setNotice(null);
    }
    onNotesChange(val);
  };

  const handleSampleClick = () => {
    if (notice) {
      setNotice(null);
    }
    onNotesChange(SAMPLE_NOTES);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDisabled) return;

    const result = checkNotes(notes);
    if (!result.ok) {
      setNotice({
        message: result.message,
        hint: result.hint,
        id: Date.now(),
      });
      return;
    }

    setNotice(null);
    onSubmit();
  };

  return (
    <form className="card input-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <label htmlFor="notes-input" className="form-label">
          Study Notes
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSampleClick}
          disabled={isLoading}
        >
          Try sample notes
        </button>
      </div>

      <div className="textarea-wrapper">
        <textarea
          id="notes-input"
          className="notes-textarea"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Paste or type your lecture notes, summaries, or study material here (min 20 characters)..."
          rows={10}
          disabled={isLoading}
        />
        <div className="char-counter" aria-live="polite">
          {notes.length} / 8000
        </div>
      </div>

      {notice && (
        <div key={notice.id} className="input-notice-card" role="alert">
          <div className="input-notice-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="input-notice-content">
            <p className="input-notice-message">{notice.message}</p>
            {notice.hint && <p className="input-notice-hint">{notice.hint}</p>}
          </div>
        </div>
      )}

      {!isWarmupReady && (
        <p className="warmup-hint" aria-live="polite">
          Connecting to server...
        </p>
      )}

      <div className="submit-section">
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isDisabled}
        >
          {isLoading ? 'Generating...' : 'Generate Study Set'}
        </button>
        {disabledReason && (
          <p className="field-hint" aria-live="polite">
            {disabledReason}
          </p>
        )}
      </div>
    </form>
  );
}
