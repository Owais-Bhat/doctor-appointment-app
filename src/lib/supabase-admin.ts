import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && serviceKey && !url.includes('dummy')) {
    client = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    return client
  }

  // The JSON-file mock is for local development only. In production a
  // missing database config must fail loudly instead of silently writing
  // patient data to db.json.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMockClient } = require('./supabase-mock')
  client = createMockClient() as SupabaseClient
  return client
}

/**
 * Server-only Supabase client using the service role key (bypasses RLS).
 * Every query must be scoped to the verified user in the route handler.
 * Created lazily so the app can build without database credentials.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient() as unknown as Record<string | symbol, unknown>
    const value = real[prop]
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value
  },
})
