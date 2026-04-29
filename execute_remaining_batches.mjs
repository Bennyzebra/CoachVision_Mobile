import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cjonngxtjunqdgvvtwfq.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb25uZ3h0anVucWRndnZ0d2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDg0MTQsImV4cCI6MjA3NzEyNDQxNH0.0s9PYIU7OqarWEUg3ftS5UY5fObsaGgg_xvCXlkRt9Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeBatch(batchNumber) {
  const filename = `./drill_batch_${batchNumber}.sql`;
  const sql = fs.readFileSync(filename, 'utf8');

  const statements = sql.split(';').filter(s => s.trim().length > 0);

  console.log(`Batch ${batchNumber}: Executing ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';';
    const { error } = await supabase.rpc('execute_sql', { query: statement });

    if (error) {
      console.error(`Batch ${batchNumber}, Statement ${i + 1} error:`, error);
      return false;
    }
  }

  console.log(`Batch ${batchNumber}: ✓ Complete`);
  return true;
}

async function main() {
  for (let i = 3; i <= 8; i++) {
    const success = await executeBatch(i);
    if (!success) {
      console.error(`Failed at batch ${i}`);
      process.exit(1);
    }
  }

  console.log('\n=== Checking final drill count ===');
  const { count, error } = await supabase
    .from('drills')
    .select('*', { count: 'exact', head: true })
    .eq('is_template', true);

  if (error) {
    console.error('Count error:', error);
  } else {
    console.log(`Total template drills in database: ${count}`);
  }

  process.exit(0);
}

main();
