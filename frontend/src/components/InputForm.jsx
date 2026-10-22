const SAMPLE_NOTES =
  'Photosynthesis is the process used by plants, algae, and cyanobacteria to convert light ' +
  'energy into chemical energy stored in glucose. Using sunlight, water from the soil, and ' +
  'carbon dioxide from the air, chlorophyll inside plant chloroplasts synthesizes sugars ' +
  'while releasing oxygen as a byproduct. The process consists of light-dependent reactions ' +
  'that capture solar energy to produce ATP and NADPH, and the Calvin cycle (light-independent ' +
  'reactions) that fixes carbon dioxide into carbohydrates. These carbohydrates provide fuel ' +
  'for plant growth and form the foundation of Earth’s food chains.';

export function InputForm({ notes, onNotesChange, onSubmit, isLoading, isWarmupReady }) {
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

  const handleSampleClick = () => {
    onNotesChange(SAMPLE_NOTES);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDisabled) {
      onSubmit();
    }
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
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Paste or type your lecture notes, summaries, or study material here (min 20 characters)..."
          rows={10}
          disabled={isLoading}
        />
        <div className="char-counter" aria-live="polite">
          {notes.length} / 8000
        </div>
      </div>

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
