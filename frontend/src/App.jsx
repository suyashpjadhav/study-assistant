import { useState } from 'react';
import { useGenerate } from './hooks/useGenerate.js';
import { useServerWarmup } from './hooks/useServerWarmup.js';
import { InputForm } from './components/InputForm.jsx';
import { Loading } from './components/Loading.jsx';
import { ErrorBanner } from './components/ErrorBanner.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { StudyView } from './components/StudyView.jsx';

export default function App() {
  const [notes, setNotes] = useState('');
  const { status, data, error, slow, generate, cancel } = useGenerate();
  const { ready: isWarmupReady } = useServerWarmup();

  const handleEditNotes = () => {
    cancel();
  };

  const handleNewNotes = () => {
    cancel();
    setNotes('');
  };

  const handleRegenerate = () => {
    generate(notes);
  };

  const isSuccessEmpty =
    status === 'success' &&
    (!data?.flashcards || data.flashcards.length === 0) &&
    (!data?.quiz || data.quiz.length === 0);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Study Assistant</h1>
        <p className="app-subtitle">Transform your study notes into flashcards and quizzes</p>
      </header>

      <main className="app-main">
        {status === 'loading' && (
          <Loading onCancel={cancel} slow={slow} />
        )}

        {status === 'error' && (
          <ErrorBanner
            error={error}
            onRetry={() => generate(notes)}
            onEditNotes={handleEditNotes}
          />
        )}

        {isSuccessEmpty && (
          <EmptyState onEditNotes={handleEditNotes} />
        )}

        {status === 'success' && !isSuccessEmpty && (
          <StudyView
            data={data}
            notes={notes}
            onEditNotes={handleEditNotes}
            onNewNotes={handleNewNotes}
            onRegenerate={handleRegenerate}
          />
        )}

        {status === 'idle' && (
          <InputForm
            notes={notes}
            onNotesChange={setNotes}
            onSubmit={() => generate(notes)}
            isLoading={false}
            isWarmupReady={isWarmupReady}
          />
        )}
      </main>
    </div>
  );
}
