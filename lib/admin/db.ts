import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = path.join(process.cwd(), 'data', 'admin.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
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
      action_needed TEXT DEFAULT '',
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

  // Migration: add action_needed column if missing
  const cols = db.prepare("PRAGMA table_info(tools)").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'action_needed')) {
    db.exec("ALTER TABLE tools ADD COLUMN action_needed TEXT DEFAULT ''");
  }
}

export interface AdminTool {
  id: string;
  name: string;
  icon: string;
  categories: string;
  search_volume: number;
  seo_level: number;
  seo_notes: string;
  optimizations: string;
  action_needed: string; // '' | 'analisi' | 'fix' | 'big-feature'
  lang_en: number;
  lang_it: number;
  lang_es: number;
  lang_fr: number;
  lang_de: number;
  lang_pt: number;
  notes: string;
  status: string;
  last_updated: string;
  created_at: string;
}

export function getAllTools(): AdminTool[] {
  const db = getDb();
  return db.prepare('SELECT * FROM tools ORDER BY name ASC').all() as AdminTool[];
}

export function getToolById(id: string): AdminTool | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as AdminTool | undefined;
}

export function updateTool(
  id: string,
  data: Partial<Omit<AdminTool, 'id' | 'created_at'>>
): void {
  const db = getDb();
  const fields = Object.keys(data)
    .filter((k) => k !== 'id' && k !== 'created_at')
    .map((k) => `${k} = @${k}`)
    .join(', ');

  if (!fields) return;

  const stmt = db.prepare(
    `UPDATE tools SET ${fields}, last_updated = datetime('now') WHERE id = @id`
  );
  stmt.run({ ...data, id });
}

export function upsertToolFromRegistry(tool: {
  id: string;
  name: string;
  icon: string;
  categories: string[];
  searchVolume: number;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tools (id, name, icon, categories, search_volume)
    VALUES (@id, @name, @icon, @categories, @search_volume)
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      icon = @icon,
      categories = @categories,
      search_volume = @search_volume
  `);
  stmt.run({
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    categories: JSON.stringify(tool.categories),
    search_volume: tool.searchVolume,
  });
}

export function getStats() {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number })
    .count;
  const withSeo = (
    db.prepare('SELECT COUNT(*) as count FROM tools WHERE seo_level > 0').get() as {
      count: number;
    }
  ).count;
  const fullyTranslated = (
    db
      .prepare(
        'SELECT COUNT(*) as count FROM tools WHERE lang_en = 1 AND lang_it = 1 AND lang_es = 1 AND lang_fr = 1 AND lang_de = 1 AND lang_pt = 1'
      )
      .get() as { count: number }
  ).count;
  const withNotes = (
    db
      .prepare("SELECT COUNT(*) as count FROM tools WHERE notes != '' AND notes IS NOT NULL")
      .get() as { count: number }
  ).count;
  const byStatus = db
    .prepare('SELECT status, COUNT(*) as count FROM tools GROUP BY status')
    .all() as { status: string; count: number }[];
  const bySeoLevel = db
    .prepare('SELECT seo_level, COUNT(*) as count FROM tools GROUP BY seo_level ORDER BY seo_level')
    .all() as { seo_level: number; count: number }[];
  const langCoverage = {
    en: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_en = 1').get() as { count: number }).count,
    it: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_it = 1').get() as { count: number }).count,
    es: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_es = 1').get() as { count: number }).count,
    fr: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_fr = 1').get() as { count: number }).count,
    de: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_de = 1').get() as { count: number }).count,
    pt: (db.prepare('SELECT COUNT(*) as count FROM tools WHERE lang_pt = 1').get() as { count: number }).count,
  };

  const byAction = db
    .prepare('SELECT action_needed, COUNT(*) as count FROM tools GROUP BY action_needed')
    .all() as { action_needed: string; count: number }[];

  return { total, withSeo, fullyTranslated, withNotes, byStatus, bySeoLevel, langCoverage, byAction };
}
