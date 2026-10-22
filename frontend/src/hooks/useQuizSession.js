import { useReducer, useEffect } from 'react';

export function initQuizSession(quiz = []) {
  return {
    quiz,
    queue: quiz,
    round: 1,
    index: 0,
    selected: null,
    answers: {},
    phase: 'answering', // 'answering' | 'feedback' | 'finished'
  };
}

export function quizSessionReducer(state, action) {
  switch (action.type) {
    case 'SELECT': {
      // Allowed only in 'answering' phase
      if (state.phase !== 'answering') return state;

      const optionIndex = action.payload;
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
        return state;
      }

      const currentQ = state.queue[state.index];
      if (!currentQ) return state;

      const isCorrect = optionIndex === currentQ.correctIndex;
      return {
        ...state,
        selected: optionIndex,
        answers: {
          ...state.answers,
          [currentQ.id]: {
            selected: optionIndex,
            correct: isCorrect,
          },
        },
        phase: 'feedback',
      };
    }

    case 'NEXT': {
      // Allowed only in 'feedback' phase
      if (state.phase !== 'feedback') return state;

      if (state.index < state.queue.length - 1) {
        return {
          ...state,
          index: state.index + 1,
          selected: null,
          phase: 'answering',
        };
      }

      // Reached the end of the current queue
      return {
        ...state,
        phase: 'finished',
      };
    }

    case 'RETEST_WRONG': {
      // Allowed only in 'finished' phase and if there were wrong answers
      if (state.phase !== 'finished') return state;

      // Filter in original model order only the questions answered wrongly in this round
      const wrongQuestions = state.quiz.filter(
        (q) => state.answers[q.id] && !state.answers[q.id].correct
      );

      if (wrongQuestions.length === 0) return state;

      return {
        ...state,
        queue: wrongQuestions,
        round: state.round + 1,
        index: 0,
        selected: null,
        answers: {},
        phase: 'answering',
      };
    }

    case 'RESTART': {
      return {
        ...state,
        queue: state.quiz,
        round: 1,
        index: 0,
        selected: null,
        answers: {},
        phase: 'answering',
      };
    }

    default:
      return state;
  }
}

export function useQuizSession(quiz = []) {
  const [state, dispatch] = useReducer(quizSessionReducer, quiz, initQuizSession);

  // If quiz input array changes, reset session
  useEffect(() => {
    dispatch({ type: 'RESTART' });
  }, [quiz]);

  return { state, dispatch };
}
