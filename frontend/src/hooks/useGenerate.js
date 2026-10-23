import { useReducer, useRef, useEffect, useCallback } from 'react';
import { generateStudyMaterial } from '../api/client.js';

const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  warnings: [],
  error: null,
  slow: false,
};

function generateReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return {
        status: 'loading',
        data: null,
        warnings: [],
        error: null,
        slow: false,
      };
    case 'SET_SLOW':
      return {
        ...state,
        slow: true,
      };
    case 'SUCCESS':
      return {
        status: 'success',
        data: {
          ...action.payload.data,
          warnings: action.payload.warnings,
        },
        warnings: action.payload.warnings,
        error: null,
        slow: false,
      };
    case 'ERROR':
      return {
        status: 'error',
        data: null,
        warnings: [],
        error: action.payload,
        slow: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useGenerate() {
  const [state, dispatch] = useReducer(generateReducer, initialState);

  // Request ID guard: monotonically increasing counter to discard out-of-order/stale responses
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const slowTimerRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const isClientTimeoutRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    // Invalidate any active request so incoming responses are ignored
    requestIdRef.current += 1;
    clearTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, [clearTimers]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    clearTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, [clearTimers]);

  const generate = useCallback(
    async (notes) => {
      // Abort any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimers();

      // Increment request ID so previous responses are treated as stale
      const currentRequestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isClientTimeoutRef.current = false;

      dispatch({ type: 'LOADING' });

      // 8s slow timer: flags backend cold-start / heavy work
      slowTimerRef.current = setTimeout(() => {
        if (requestIdRef.current === currentRequestId) {
          dispatch({ type: 'SET_SLOW' });
        }
      }, 8000);

      // 60s client timeout: aborts request with a dedicated timeout flag
      timeoutTimerRef.current = setTimeout(() => {
        if (requestIdRef.current === currentRequestId) {
          isClientTimeoutRef.current = true;
          controller.abort();
        }
      }, 60000);

      try {
        const result = await generateStudyMaterial(notes, controller.signal);
        clearTimers();

        // Stale guard: ignore if a newer request was dispatched
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        dispatch({ type: 'SUCCESS', payload: result });
      } catch (err) {
        clearTimers();

        // Stale guard: ignore errors for superseded requests
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        // If aborted by client timeout, dispatch the specified CLIENT_TIMEOUT error
        if (isClientTimeoutRef.current) {
          dispatch({
            type: 'ERROR',
            payload: {
              code: 'CLIENT_TIMEOUT',
              message: 'The request took too long.',
              retryable: true,
            },
          });
          return;
        }

        // If user cancelled manually via AbortController, silently ignore
        if (err.name === 'AbortError') {
          return;
        }

        dispatch({
          type: 'ERROR',
          payload: {
            code: err.code || 'BAD_RESPONSE',
            message: err.message || 'An unexpected error occurred.',
            retryable: err.retryable ?? false,
          },
        });
      }
    },
    [clearTimers]
  );

  // Abort request and clear timers on component unmount
  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      clearTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearTimers]);

  return {
    ...state,
    generate,
    cancel,
    reset,
  };
}
