import { useState, useEffect } from 'react';
import { pingServer } from '../api/client.js';

export function useServerWarmup() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    pingServer(controller.signal)
      .then(() => {
        setReady(true);
      })
      .catch(() => {
        // Fire-and-forget: silently ignore errors on warmup
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { ready };
}
