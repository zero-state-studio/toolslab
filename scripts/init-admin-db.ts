/**
 * Initialize the admin SQLite database with tools from the registry.
 * Run: npx tsx scripts/init-admin-db.ts
 */
import path from 'path';
import Database from 'better-sqlite3';
import { tools } from '../lib/tools';

const DB_PATH = path.join(__dirname, '..', 'data', 'admin.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    categories TEXT DEFAULT '[]',
    search_volume INTEGER DEFAULT 0,
    seo_level INTEGER DEFAULT 0,
    seo_notes TEXT DEFAULT '',
    optimizations TEXT DEFAULT '',
    lang_en INTEGER DEFAULT 0,
    lang_it INTEGER DEFAULT 0,
    lang_es INTEGER DEFAULT 0,
    lang_fr INTEGER DEFAULT 0,
    lang_de INTEGER DEFAULT 0,
    lang_pt INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    last_updated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Upsert all tools from registry
const stmt = db.prepare(`
  INSERT INTO tools (id, name, icon, categories, search_volume)
  VALUES (@id, @name, @icon, @categories, @search_volume)
  ON CONFLICT(id) DO UPDATE SET
    name = @name,
    icon = @icon,
    categories = @categories,
    search_volume = @search_volume
`);

const upsertMany = db.transaction((toolList: typeof tools) => {
  for (const tool of toolList) {
    stmt.run({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      categories: JSON.stringify(tool.categories),
      search_volume: tool.searchVolume,
    });
  }
});

upsertMany(tools);

console.log(`✅ Admin DB initialized at ${DB_PATH}`);
console.log(`   ${tools.length} tools synced from registry`);

db.close();
