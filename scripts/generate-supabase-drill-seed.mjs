import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "drills_complete.json");
const outputPath = resolve(
  root,
  "supabase/migrations/20260824001000_restore_coachvision_drill_catalog.sql"
);
const baselinePath = resolve(
  root,
  "supabase/migrations/20260824000000_restore_coachvision_baseline.sql"
);
const combinedOutputPath = resolve(root, "supabase/coachvision_restore.sql");

const drills = JSON.parse(await readFile(sourcePath, "utf8"));

if (!Array.isArray(drills) || drills.length !== 200) {
  throw new Error("Expected drills_complete.json to contain exactly 200 drills.");
}

if (new Set(drills.map((drill) => drill.name)).size !== drills.length) {
  throw new Error("Drill names must be unique so the restored catalog is deterministic.");
}

const sqlLiteral = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};

const textArray = (values) =>
  `ARRAY[${values.map((value) => sqlLiteral(value)).join(", ")}]::TEXT[]`;

const columns = [
  "coach_id",
  "name",
  "focus",
  "duration",
  "rating",
  "verified",
  "description",
  "cues",
  "tags",
  "media_url",
  "min_players",
  "max_players",
  "optimal_group_size",
  "level",
  "intensity",
  "positions_emphasis",
  "requires_full_court",
  "is_template",
];

const rows = drills.map((drill) => {
  const values = [
    "NULL::UUID",
    sqlLiteral(drill.name),
    sqlLiteral(drill.focus),
    sqlLiteral(drill.duration),
    sqlLiteral(drill.rating),
    sqlLiteral(drill.verified),
    sqlLiteral(drill.description),
    textArray(drill.cues),
    textArray(drill.tags),
    sqlLiteral(drill.media_url),
    sqlLiteral(drill.min_players),
    sqlLiteral(drill.max_players),
    sqlLiteral(drill.optimal_group_size),
    sqlLiteral(drill.level),
    sqlLiteral(drill.intensity),
    `${sqlLiteral(JSON.stringify(drill.positions_emphasis))}::JSONB`,
    sqlLiteral(drill.requires_full_court),
    sqlLiteral(drill.is_template),
  ];

  return `  (${values.join(", ")})`;
});

const catalogCte = `catalog (${columns.join(", ")}) AS (\n  VALUES\n${rows.join(",\n")}\n)`;
const mutableColumns = columns.filter((column) => !["coach_id", "name"].includes(column));
const catalogNames = drills.map((drill) => sqlLiteral(drill.name)).join(", ");

const sql = `-- Generated from drills_complete.json by scripts/generate-supabase-drill-seed.mjs.\n-- Safe to re-run: canonical global drills are updated in place and missing drills are inserted.\n-- Coach-owned drills and drill IDs referenced by saved plans are never deleted.\n\nWITH ${catalogCte}\nUPDATE public.drills AS drill\nSET\n  ${mutableColumns.map((column) => `${column} = catalog.${column}`).join(",\n  ")}\nFROM catalog\nWHERE drill.coach_id IS NULL\n  AND drill.name = catalog.name;\n\nWITH ${catalogCte}\nINSERT INTO public.drills (\n  ${columns.join(",\n  ")}\n)\nSELECT\n  ${columns.map((column) => `catalog.${column}`).join(",\n  ")}\nFROM catalog\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM public.drills AS existing\n  WHERE existing.coach_id IS NULL\n    AND existing.name = catalog.name\n);\n\nDO $$\nBEGIN\n  IF (\n    SELECT COUNT(DISTINCT name)\n    FROM public.drills\n    WHERE coach_id IS NULL\n      AND name = ANY (ARRAY[${catalogNames}]::TEXT[])\n  ) <> 200 THEN\n    RAISE EXCEPTION 'Expected all 200 canonical CoachVision drills after seeding.';\n  END IF;\nEND $$;\n`;

await writeFile(outputPath, sql);
const baselineSql = await readFile(baselinePath, "utf8");
await writeFile(
  combinedOutputPath,
  `BEGIN;\n\n${baselineSql.trimEnd()}\n\n-- ============================================================\n-- Canonical 200-drill CoachVision catalog\n-- ============================================================\n\n${sql.trimEnd()}\n\nCOMMIT;\n`
);
console.log(`Wrote ${drills.length} drills to ${outputPath} and ${combinedOutputPath}`);
