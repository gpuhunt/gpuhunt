import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "src", "data", "gpuhunt.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    website TEXT NOT NULL,
    affiliate_url TEXT,
    logo_url TEXT,
    description TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES providers(id),
    name TEXT NOT NULL,
    cpu TEXT,
    cpu_cores INTEGER,
    cpu_threads INTEGER,
    ram_gb INTEGER,
    storage_type TEXT,
    storage_gb INTEGER,
    gpu_model TEXT,
    gpu_count INTEGER DEFAULT 0,
    gpu_vram_gb INTEGER,
    bandwidth_tb REAL,
    price_monthly REAL,
    price_hourly REAL,
    currency TEXT DEFAULT 'USD',
    location TEXT,
    available INTEGER DEFAULT 1,
    url TEXT NOT NULL,
    raw_data TEXT,
    scraped_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(provider_id, id)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT NOT NULL REFERENCES servers(id),
    price_monthly REAL,
    price_hourly REAL,
    available INTEGER,
    recorded_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_servers_gpu ON servers(gpu_model, gpu_count);
  CREATE INDEX IF NOT EXISTS idx_servers_price ON servers(price_monthly);
  CREATE INDEX IF NOT EXISTS idx_servers_provider ON servers(provider_id);
  CREATE INDEX IF NOT EXISTS idx_servers_available ON servers(available);
  CREATE INDEX IF NOT EXISTS idx_price_history_server ON price_history(server_id);
`);

console.log("Migration complete. Database at:", DB_PATH);
db.close();
