"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/** fetch() with the signed-in user's token attached. Throws with the API's error message. */
export function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const res = await fetch(path, {
        ...init,
        headers: {
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
      return data as T;
    },
    [getToken],
  );
}

type Result<T> = { key: string | null; data: T | null; error: string | null };

/**
 * Load JSON from an API route. With `auth: true` (default) it waits for
 * sign-in and sends the token. Pass `null` as the path to skip loading.
 */
export function useApi<T>(path: string | null, { auth = true }: { auth?: boolean } = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const authedFetch = useAuthedFetch();
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null });
  const [version, setVersion] = useState(0);

  const ready = !!path && (!auth || (!authLoading && !!user));
  const key = ready ? `${path}#${version}` : null;

  useEffect(() => {
    if (!key || !path) return;
    let cancelled = false;
    // authedFetch also throws on non-2xx responses, so 404s surface as errors
    authedFetch<T>(path)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((e: Error) => !cancelled && setResult({ key, data: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, path, authedFetch]);

  // Loading until the response for the current request arrives (or while sign-in resolves)
  const loading = !!path && (key ? result.key !== key : auth && authLoading);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: result.data, error: loading ? null : result.error, loading, reload };
}
