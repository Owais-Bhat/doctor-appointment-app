import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from './api';
import { cacheGet, cacheSet } from './offline';

type State<T> = { data: T | null; error: string | null; loading: boolean; refreshing: boolean };

/**
 * GET a path from the MedFlow API. `refresh()` re-fetches without flashing the
 * skeleton (for pull-to-refresh). Pass `path = null` to skip fetching.
 */
export function useApi<T>(path: string | null, { auth = true }: { auth?: boolean } = {}) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: path !== null, refreshing: false });
  const seq = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (path === null) return;
      const id = ++seq.current;
      setState((s) => ({ ...s, error: null, loading: mode === 'initial', refreshing: mode === 'refresh' }));
      try {
        const data = await api<T>(path, { auth });
        void cacheSet(path, data);
        if (id === seq.current) setState({ data, error: null, loading: false, refreshing: false });
      } catch (e) {
        // No connection: show the last answer this phone saw, if it kept one
        if (e instanceof ApiError && e.status === 0) {
          const saved = await cacheGet<T>(path);
          if (saved && id === seq.current) {
            setState({ data: saved.data, error: null, loading: false, refreshing: false });
            return;
          }
        }
        if (id === seq.current) {
          setState((s) => ({ ...s, error: e instanceof ApiError ? e.message : 'Something went wrong.', loading: false, refreshing: false }));
        }
      }
    },
    [path, auth],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  return { ...state, refresh, reload: () => load('initial') };
}
