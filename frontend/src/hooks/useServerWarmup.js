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
      .catch((err) => {
        // If err.name === 'AbortError': do nothing (the effect was cleaned up on unmount);
        // otherwise: call setReady(true), because the hint is informational and a failed ping must not leave it on screen forever.
        if (err?.name === 'AbortError') {
          return;
        }
        setReady(true);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { ready };
}
