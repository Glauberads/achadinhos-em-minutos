import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cmgpdbknyateiyybdtwe.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3BkYmtueWF0ZWl5eWJkdHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE2OTc0MiwiZXhwIjoyMDk3NzQ1NzQyfQ.-FI0k02DefhWJTT6zg0HCKRFGfMMudDTL5f4TCf7F8Y';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fix() {
  console.log('Checking feature_flags table...');
  const { data: existingFlags, error: listError } = await supabase.from('feature_flags').select('key, enabled');
  
  if (listError) {
    console.error('Error listing flags:', listError);
    return;
  }
  
  console.log('Existing flags:', existingFlags);
  
  // Upsert the creative_studio_ai flag
  const { data, error } = await supabase.from('feature_flags').upsert({
    key: 'creative_studio_ai',
    name: 'Creative Studio AI',
    description: 'Módulo de geração automática de vídeos via IA a partir de links de produtos',
    enabled: true,
    target_type: 'global',
    target_ids: [],
    metadata: {}
  }, { onConflict: 'key' });
  
  if (error) {
    console.error('Error inserting creative_studio_ai flag:', error);
    return;
  }
  
  console.log('✅ creative_studio_ai flag created/updated successfully');
  
  // Also enable ai_gemini and analytics
  const { error: updateError } = await supabase.from('feature_flags').update({ enabled: true }).in('key', ['ai_gemini', 'analytics']);
  if (updateError) console.error('Error enabling other flags:', updateError);
  else console.log('✅ ai_gemini and analytics flags enabled');
  
  // Confirm
  const { data: allFlags } = await supabase.from('feature_flags').select('key, enabled, target_type');
  console.log('\nAll flags now:', allFlags);
}

fix().catch(console.error);
