import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const drills = JSON.parse(fs.readFileSync('./drills_complete.json', 'utf8'));

const supabaseUrl = 'https://cjonngxtjunqdgvvtwfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb25uZ3h0anVucWRndnZ0d2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDg0MTQsImV4cCI6MjA3NzEyNDQxNH0.0s9PYIU7OqarWEUg3ftS5UY5fObsaGgg_xvCXlkRt9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertRemaining() {
  const batch1Start = 50;
  const batchSize = 25;

  for (let i = batch1Start; i < drills.length; i += batchSize) {
    const batch = drills.slice(i, Math.min(i + batchSize, drills.length));
    console.log(`Inserting drills ${i + 1}-${Math.min(i + batchSize, drills.length)}...`);

    const drillsToInsert = batch.map(drill => ({
      coach_id: null,
      name: drill.name,
      focus: drill.focus,
      duration: drill.duration,
      rating: drill.rating,
      verified: drill.verified,
      description: drill.description,
      cues: drill.cues,
      tags: drill.tags,
      media_url: drill.media_url,
      min_players: drill.min_players,
      max_players: drill.max_players,
      optimal_group_size: drill.optimal_group_size,
      level: drill.level,
      intensity: drill.intensity,
      positions_emphasis: drill.positions_emphasis,
      requires_full_court: drill.requires_full_court,
      is_template: drill.is_template
    }));

    const { error } = await supabase.from('drills').insert(drillsToInsert);

    if (error) {
      console.error(`Error inserting batch starting at ${i}:`, error);
      return;
    }

    console.log(`✓ Batch complete`);
  }

  console.log('\n=== Checking final count ===');
  const { count, error: countError } = await supabase
    .from('drills')
    .select('*', { count: 'exact', head: true })
    .eq('is_template', true);

  if (countError) {
    console.error('Count error:', countError);
  } else {
    console.log(`Total template drills: ${count}`);
  }
}

insertRemaining();
