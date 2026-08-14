import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function requireServerEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = requireServerEnv('SUPABASE_URL');
// This credential is server-only and bypasses RLS. Never expose it to the frontend.
const supabaseServiceKey = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY');

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
