import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('get_tables_without_rls'); // we don't have this rpc.
  
  // Let's just do a direct sql via rest api or let's try to query the table directly
  const { data: tData, error: tErr } = await supabase.from('rls_desativado_em_publico').select('*').limit(1);
  console.log('rls_desativado_em_publico table check:', tErr ? tErr.message : 'Table exists!');

  // Let's also check profiles just to ensure connection works
  const { error: pErr } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles table check:', pErr ? pErr.message : 'Table exists!');
}

check();
