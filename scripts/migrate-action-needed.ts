import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = path.join(__dirname, '..', 'data', 'admin.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Add column if missing
const cols = db.prepare("PRAGMA table_info(tools)").all() as { name: string }[];
if (!cols.some(c => c.name === 'action_needed')) {
  db.exec("ALTER TABLE tools ADD COLUMN action_needed TEXT DEFAULT ''");
  console.log('Column action_needed added');
} else {
  console.log('Column action_needed already exists');
}

// Tools that need NO action
const noAction = [
  'hash-generator',
  'gradient-generator',
  'barcode-generator',
  'js-object-to-json',
  'jwt-decoder',
  'list-compare',
];

// Set all to 'analisi' first
db.prepare("UPDATE tools SET action_needed = 'analisi', last_updated = datetime('now')").run();
console.log('All tools set to "analisi"');

// Then clear the ones that need no action
const clearStmt = db.prepare("UPDATE tools SET action_needed = '', last_updated = datetime('now') WHERE id = ?");
for (const id of noAction) {
  clearStmt.run(id);
}
console.log(`${noAction.length} tools marked as no action needed: ${noAction.join(', ')}`);

// Summary
const stats = db.prepare("SELECT action_needed, COUNT(*) as c FROM tools GROUP BY action_needed").all() as { action_needed: string; c: number }[];
console.log('\nSummary:');
for (const s of stats) {
  console.log(`  ${s.action_needed || '(none)'}: ${s.c}`);
}

db.close();
