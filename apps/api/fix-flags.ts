import { createClient } from '@supabase/supabase-js';

function requireEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabase = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
);

async function fix() {
  console.log('Checking feature_flags table...');
  const { data: existingFlags, error: listError } = await supabase
    .from('feature_flags')
    .select('key, enabled');

  if (listError) {
    console.error('Error listing flags:', listError);
    return;
  }

  console.log('Existing flags:', existingFlags);

  const { error } = await supabase.from('feature_flags').upsert(
    {
      key: 'creative_studio_ai',
      name: 'Creative Studio AI',
      description: 'Módulo de geração automática de vídeos via IA a partir de links de produtos',
      enabled: true,
      target_type: 'global',
      target_ids: [],
      metadata: {},
    },
    { onConflict: 'key' },
  );

  if (error) {
    console.error('Error inserting creative_studio_ai flag:', error);
    return;
  }

  console.log('✅ creative_studio_ai flag created/updated successfully');

  const { error: updateError } = await supabase
    .from('feature_flags')
    .update({ enabled: true })
    .in('key', ['ai_gemini', 'analytics']);

  if (updateError) {
    console.error('Error enabling other flags:', updateError);
  } else {
    console.log('✅ ai_gemini and analytics flags enabled');
  }

  const { data: allFlags } = await supabase
    .from('feature_flags')
    .select('key, enabled, target_type');
  console.log('\nAll flags now:', allFlags);
}

fix().catch(console.error);
