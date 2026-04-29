import fs from 'fs';

const drills = JSON.parse(fs.readFileSync('./drills_complete.json', 'utf8'));

function escapeString(str) {
  if (!str) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

function formatArray(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  return `ARRAY[${arr.map(s => escapeString(s)).join(', ')}]`;
}

function formatJsonb(obj) {
  if (!obj) return "NULL";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function generateInsert(drill) {
  return `INSERT INTO drills (coach_id, name, focus, duration, rating, verified, description, cues, tags, media_url, min_players, max_players, optimal_group_size, level, intensity, positions_emphasis, requires_full_court, is_template) VALUES (NULL, ${escapeString(drill.name)}, ${escapeString(drill.focus)}, ${drill.duration}, ${drill.rating}, ${drill.verified}, ${escapeString(drill.description)}, ${formatArray(drill.cues)}, ${formatArray(drill.tags)}, ${drill.media_url ? escapeString(drill.media_url) : 'NULL'}, ${drill.min_players}, ${drill.max_players}, ${drill.optimal_group_size}, ${escapeString(drill.level)}, ${drill.intensity}, ${formatJsonb(drill.positions_emphasis)}, ${drill.requires_full_court}, ${drill.is_template});`;
}

const batchSize = 25;
const totalBatches = Math.ceil(drills.length / batchSize);

for (let i = 0; i < totalBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, drills.length);
  const batch = drills.slice(start, end);

  const sql = batch.map(generateInsert).join('\n');
  fs.writeFileSync(`./drill_batch_${i + 1}.sql`, sql);
  console.log(`Created batch ${i + 1} with ${batch.length} drills`);
}

console.log(`Total batches created: ${totalBatches}`);
