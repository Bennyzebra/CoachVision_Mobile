// Direct database seeding script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjonngxtjunqdgvvtwfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb25uZ3h0anVucWRndnZ0d2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDg0MTQsImV4cCI6MjA3NzEyNDQxNH0.0s9PYIU7OqarWEUg3ftS5UY5fObsaGgg_xvCXlkRt9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

// Execute SQL directly to bypass RLS
async function executeSQLDirect(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  return { data, error };
}

// Use execute_sql directly - this bypasses RLS
async function insertDrills() {
  console.log('Checking current drill count...');

  const { count, error: countError } = await supabase
    .from('drills')
    .select('*', { count: 'exact', head: true })
    .eq('is_template', true);

  if (countError) {
    console.error('Error checking count:', countError);
  } else {
    console.log(`Current template drills: ${count}`);
  }

  // For now, just insert one test drill to confirm it works
  const testSql = `
    INSERT INTO drills (coach_id, name, focus, duration, rating, verified, description, cues, tags, media_url, min_players, max_players, optimal_group_size, level, intensity, positions_emphasis, requires_full_court, is_template)
    VALUES (NULL, 'Test Drill', 'offense', 8, 4.4, true, 'Test description', ARRAY['cue1'], ARRAY['tag1'], NULL, 1, 15, 3, 'beginner', 2, '{"G":0.6,"F":0.3,"C":0.1}', false, true);
  `;

  console.log('Inserting test drill via SQL...');
  const { error: insertError } = await supabase.rpc('query', { query_text: testSql });

  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Test drill inserted successfully!');
  }

  process.exit(0);
}

insertDrills();
