import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = (url && serviceKey && !url.includes('dummy'))
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : (() => {
      const { createMockClient } = require('./supabase-mock');
      return createMockClient();
    })();

