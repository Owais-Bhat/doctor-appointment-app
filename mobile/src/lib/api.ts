import { API_URL } from './config';
import { setOffline } from './offline';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenGetter = (forceRefresh?: boolean) => Promise<string | null>;
let getToken: TokenGetter = async () => null;

/** The auth context registers how to obtain a fresh Firebase ID token. */
export function setTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

/** The Authorization header for requests made outside api() (image previews, file downloads). */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new ApiError('Please sign in again.', 401);
  return { Authorization: `Bearer ${token}` };
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; auth?: boolean; signal?: AbortSignal };

/**
 * Calls the MedFlow web API. Identity is the Firebase ID token in the
 * Authorization header — the server never trusts anything else.
 */
export async function api<T>(path: string, { method = 'GET', body, auth = true, signal }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getToken();
    if (!token) throw new ApiError('Please sign in again.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    setOffline(true);
    throw new ApiError('No connection. Check your internet and try again.', 0);
  }
  setOffline(false);

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.error === 'string' && data.error ? data.error : `Something went wrong (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}
