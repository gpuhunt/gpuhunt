import Database from "better-sqlite3";
import path from "path";
import { Server, ServerWithProvider, ServerFilters, Provider } from "./types";

const DB_PATH = path.join(process.cwd(), "src", "data", "gpuhunt.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    // Open read-only so Vercel's read-only filesystem doesn't cause issues.
    // upsertServer/recordPriceHistory only run in scraper scripts, not web requests.
    try {
      _db = new Database(DB_PATH, { readonly: true });
    } catch {
      _db = new Database(DB_PATH);
    }
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// Separate writable connection used only by scraper scripts
let _dbWrite: Database.Database | null = null;
export function getDbWrite(): Database.Database {
  if (!_dbWrite) {
    _dbWrite = new Database(DB_PATH);
    _dbWrite.pragma("journal_mode = WAL");
    _dbWrite.pragma("foreign_keys = ON");
  }
  return _dbWrite;
}

export function getProviders(): Provider[] {
  const db = getDb();
  return db.prepare("SELECT * FROM providers ORDER BY name").all() as Provider[];
}

export function getProviderBySlug(slug: string): Provider | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM providers WHERE slug = ?")
    .get(slug) as Provider | undefined;
}

export function getServers(filters: ServerFilters = {}): ServerWithProvider[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.gpu_model) {
    // Use starts-with LIKE so "NVIDIA H100" matches "NVIDIA H100 SXM5", "NVIDIA H100 PCIe", etc.
    conditions.push("s.gpu_model LIKE ?");
    params.push(`${filters.gpu_model}%`);
  }
  if (filters.provider) {
    conditions.push("p.slug = ?");
    params.push(filters.provider);
  }
  if (filters.exclude_providers && filters.exclude_providers.length > 0) {
    const placeholders = filters.exclude_providers.map(() => "?").join(", ");
    conditions.push(`p.slug NOT IN (${placeholders})`);
    params.push(...filters.exclude_providers);
  }
  if (filters.min_price !== undefined) {
    conditions.push("s.price_monthly >= ?");
    params.push(filters.min_price);
  }
  if (filters.max_price !== undefined) {
    conditions.push("s.price_monthly <= ?");
    params.push(filters.max_price);
  }
  if (filters.min_ram !== undefined) {
    conditions.push("s.ram_gb >= ?");
    params.push(filters.min_ram);
  }
  if (filters.min_gpu_vram !== undefined) {
    conditions.push("s.gpu_vram_gb >= ?");
    params.push(filters.min_gpu_vram);
  }
  if (filters.min_gpu_count !== undefined) {
    conditions.push("s.gpu_count >= ?");
    params.push(filters.min_gpu_count);
  }
  if (filters.available_only !== false) {
    conditions.push("s.available = 1");
  }
  if (filters.search) {
    conditions.push(
      "(s.name LIKE ? OR s.gpu_model LIKE ? OR s.cpu LIKE ? OR p.name LIKE ?)"
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortCol = filters.sort_by || "price_monthly";
  const sortDir = filters.sort_order || "asc";
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  const sql = `
    SELECT s.*, p.name as provider_name, p.slug as provider_slug, p.website as provider_website
    FROM servers s
    JOIN providers p ON s.provider_id = p.id
    ${where}
    ORDER BY s.${sortCol} ${sortDir} NULLS LAST
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);
  return db.prepare(sql).all(...params) as ServerWithProvider[];
}

export function getServerCount(filters: ServerFilters = {}): number {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.gpu_model) {
    conditions.push("s.gpu_model LIKE ?");
    params.push(`${filters.gpu_model}%`);
  }
  if (filters.provider) {
    conditions.push("p.slug = ?");
    params.push(filters.provider);
  }
  if (filters.exclude_providers && filters.exclude_providers.length > 0) {
    const placeholders = filters.exclude_providers.map(() => "?").join(", ");
    conditions.push(`p.slug NOT IN (${placeholders})`);
    params.push(...filters.exclude_providers);
  }
  if (filters.min_price !== undefined) {
    conditions.push("s.price_monthly >= ?");
    params.push(filters.min_price);
  }
  if (filters.max_price !== undefined) {
    conditions.push("s.price_monthly <= ?");
    params.push(filters.max_price);
  }
  if (filters.min_ram !== undefined) {
    conditions.push("s.ram_gb >= ?");
    params.push(filters.min_ram);
  }
  if (filters.min_gpu_count !== undefined) {
    conditions.push("s.gpu_count >= ?");
    params.push(filters.min_gpu_count);
  }
  if (filters.available_only !== false) {
    conditions.push("s.available = 1");
  }
  if (filters.search) {
    conditions.push(
      "(s.name LIKE ? OR s.gpu_model LIKE ? OR s.cpu LIKE ? OR p.name LIKE ?)"
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT COUNT(*) as count FROM servers s
    JOIN providers p ON s.provider_id = p.id
    ${where}
  `;

  const row = db.prepare(sql).get(...params) as { count: number };
  return row.count;
}

// Canonical GPU families for homepage Browse by GPU section.
// Each family uses a prefix search so "NVIDIA H100" matches SXM5, PCIe, NVL, etc.
export const GPU_FAMILIES = [
  // NVIDIA flagship / current-gen
  { family: "NVIDIA B300",          label: "B300",          badge: "badge-green",  tier: "flagship" },
  { family: "NVIDIA B200",          label: "B200",          badge: "badge-green",  tier: "flagship" },
  { family: "NVIDIA H200",          label: "H200",          badge: "badge-green",  tier: "flagship" },
  { family: "NVIDIA H100",          label: "H100",          badge: "badge-green",  tier: "flagship" },
  { family: "NVIDIA GH200",         label: "GH200",         badge: "badge-green",  tier: "flagship" },
  { family: "NVIDIA A100",          label: "A100",          badge: "badge-cyan",   tier: "flagship" },
  // AMD flagship
  { family: "AMD Instinct MI355X",  label: "MI355X",        badge: "badge-green",  tier: "flagship" },
  { family: "AMD Instinct MI325X",  label: "MI325X",        badge: "badge-green",  tier: "flagship" },
  { family: "AMD Instinct MI300X",  label: "MI300X",        badge: "badge-green",  tier: "flagship" },
  // Intel Gaudi
  { family: "Intel Gaudi",          label: "Gaudi 2/3",     badge: "badge-indigo", tier: "flagship" },
  // NVIDIA pro / datacenter
  { family: "NVIDIA L40S",          label: "L40S",          badge: "badge-cyan",   tier: "pro"      },
  { family: "NVIDIA L40",           label: "L40",           badge: "badge-cyan",   tier: "pro"      },
  { family: "NVIDIA L4",            label: "L4",            badge: "badge-cyan",   tier: "pro"      },
  { family: "NVIDIA A40",           label: "A40",           badge: "badge-indigo", tier: "pro"      },
  { family: "NVIDIA A10",           label: "A10",           badge: "badge-muted",  tier: "pro"      },
  { family: "NVIDIA A16",           label: "A16",           badge: "badge-muted",  tier: "pro"      },
  { family: "NVIDIA A6000",         label: "RTX A6000",     badge: "badge-indigo", tier: "pro"      },
  { family: "NVIDIA RTX 6000 Ada",  label: "RTX 6000 Ada",  badge: "badge-indigo", tier: "pro"      },
  { family: "NVIDIA T4",            label: "Tesla T4",      badge: "badge-muted",  tier: "pro"      },
  // Consumer / high-end
  { family: "NVIDIA RTX 5090",      label: "RTX 5090",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 5080",      label: "RTX 5080",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 5070",      label: "RTX 5070",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 4090",      label: "RTX 4090",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 4080",      label: "RTX 4080",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 3090",      label: "RTX 3090",      badge: "badge-amber",  tier: "consumer" },
  { family: "NVIDIA RTX 3080",      label: "RTX 3080",      badge: "badge-muted",  tier: "consumer" },
  // Legacy
  { family: "NVIDIA V100",          label: "V100",          badge: "badge-muted",  tier: "legacy"   },
  { family: "NVIDIA Tesla T4",      label: "Tesla T4",      badge: "badge-muted",  tier: "legacy"   },
  { family: "AMD Instinct MI250",   label: "MI250X",        badge: "badge-muted",  tier: "legacy"   },
];

export function getGpuFamilyCounts(): Array<typeof GPU_FAMILIES[0] & { count: number; cheapest: number | null; avg: number | null; providers: number }> {
  const db = getDb();
  return GPU_FAMILIES.map((fam) => {
    const row = db.prepare(
      `SELECT COUNT(*) as count, MIN(price_hourly) as cheapest, AVG(price_hourly) as avg,
              COUNT(DISTINCT s.provider_id) as providers
       FROM servers s
       JOIN providers p ON s.provider_id = p.id
       WHERE s.gpu_model LIKE ? AND s.available = 1 AND s.gpu_count >= 1`
    ).get(`${fam.family}%`) as { count: number; cheapest: number | null; avg: number | null; providers: number };
    return { ...fam, count: row.count, cheapest: row.cheapest, avg: row.avg, providers: row.providers };
  }).filter((f) => f.count > 0);
}

export function getGpuFamilyStats(family: string): { cheapest: number | null; avg: number | null; providers: number; configs: number } {
  const db = getDb();
  const row = db.prepare(
    `SELECT MIN(price_hourly) as cheapest, AVG(price_hourly) as avg,
            COUNT(DISTINCT s.provider_id) as providers, COUNT(*) as configs
     FROM servers s
     WHERE s.gpu_model LIKE ? AND s.available = 1 AND s.gpu_count >= 1 AND s.price_hourly IS NOT NULL`
  ).get(`${family}%`) as { cheapest: number | null; avg: number | null; providers: number; configs: number };
  return row;
}

export function getServersByLocation(region: string): ServerWithProvider[] {
  const db = getDb();
  // Map region slug to location patterns
  const patterns: Record<string, string[]> = {
    "us":   ["US", "CA"],
    "eu":   ["EU", "EU-FR", "DE", "FR", "NL", "GB", "FI", "SE", "NO", "PL", "ES", "IT", "PT", "RO", "CZ", "SK", "HU", "GR", "BG", "HR", "SI", "LT", "IS"],
    "apac": ["JP", "NRT", "AU", "SG", "KR", "IN", "HK", "TW", "TH", "VN", "CN"],
  };
  const locs = patterns[region] ?? [];
  if (locs.length === 0) return [];
  const placeholders = locs.map(() => "s.location = ?").join(" OR ");
  return db.prepare(
    `SELECT s.*, p.name as provider_name, p.slug as provider_slug, p.website as provider_website
     FROM servers s JOIN providers p ON s.provider_id = p.id
     WHERE (${placeholders}) AND s.available = 1
     ORDER BY s.price_hourly ASC NULLS LAST LIMIT 200`
  ).all(...locs) as ServerWithProvider[];
}

export function getGpuModels(): { gpu_model: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT gpu_model, COUNT(*) as count FROM servers
       WHERE gpu_model IS NOT NULL AND available = 1
       GROUP BY gpu_model ORDER BY count DESC`
    )
    .all() as { gpu_model: string; count: number }[];
}

export function getServersByGpu(gpuModel: string): ServerWithProvider[] {
  return getServers({ gpu_model: gpuModel, available_only: true, sort_by: "price_monthly" });
}

export function getServersByProvider(providerSlug: string): ServerWithProvider[] {
  return getServers({ provider: providerSlug, available_only: false, sort_by: "price_monthly" });
}

export function getGpuPriceHistory(gpuModel: string, days = 30): Array<{ recorded_at: string; avg_price_hourly: number | null; min_price_hourly: number | null }> {
  const db = getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return db.prepare(`
    SELECT
      date(ph.recorded_at) as recorded_at,
      AVG(ph.price_hourly) as avg_price_hourly,
      MIN(ph.price_hourly) as min_price_hourly
    FROM price_history ph
    JOIN servers s ON ph.server_id = s.id
    WHERE s.gpu_model LIKE ? AND ph.price_hourly IS NOT NULL AND ph.recorded_at >= ?
    GROUP BY date(ph.recorded_at)
    ORDER BY recorded_at ASC
  `).all(`${gpuModel}%`, since) as Array<{ recorded_at: string; avg_price_hourly: number | null; min_price_hourly: number | null }>;
}

// Location prefix patterns per region — uses LIKE matching so "US" matches "US", "US-EAST", "US-TX-3", etc.
export const REGION_LOCATION_PREFIXES: Record<string, string[]> = {
  "us":   ["US", "CA"],
  "eu":   ["EU", "DE", "FR", "NL", "GB", "FI", "SE", "NO", "PL", "ES", "IT", "PT", "RO", "CZ", "SK", "HU", "GR", "BG", "HR", "SI", "LT", "IS"],
  "apac": ["JP", "NRT", "AU", "SG", "KR", "IN", "HK", "TW", "TH", "VN", "CN"],
};

/**
 * Returns the best (cheapest hourly) deal for each GPU family.
 * Optionally filters by geographic region using LIKE prefix matching on location.
 * exclude_providers filters out marketplace/spot providers.
 */
export function getBestDealsPerFamily(opts: {
  region?: string;
  exclude_providers?: string[];
  limit?: number;
} = {}): ServerWithProvider[] {
  const db = getDb();
  const { region, exclude_providers = [], limit = 8 } = opts;

  const conditions: string[] = ["s.available = 1", "s.gpu_count >= 1", "s.price_hourly IS NOT NULL", "s.gpu_model IS NOT NULL"];
  const params: (string | number)[] = [];

  // Location filter — LIKE prefix matching
  if (region) {
    const prefixes = REGION_LOCATION_PREFIXES[region] ?? [];
    if (prefixes.length > 0) {
      const locClauses = prefixes.map(() => "s.location LIKE ?").join(" OR ");
      conditions.push(`(${locClauses})`);
      params.push(...prefixes.map((p) => `${p}%`));
    }
  }

  // Exclude marketplace providers
  if (exclude_providers.length > 0) {
    const placeholders = exclude_providers.map(() => "?").join(", ");
    conditions.push(`p.slug NOT IN (${placeholders})`);
    params.push(...exclude_providers);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const sql = `
    SELECT s.*, p.name as provider_name, p.slug as provider_slug, p.website as provider_website
    FROM servers s
    JOIN providers p ON s.provider_id = p.id
    ${where}
    ORDER BY s.price_hourly ASC
    LIMIT 500
  `;

  const all = db.prepare(sql).all(...params) as ServerWithProvider[];

  // One best deal per GPU family — deduplicate using GPU_FAMILIES prefix list
  const seen = new Set<string>();
  const deduped: ServerWithProvider[] = [];

  for (const server of all) {
    const family = GPU_FAMILIES.find((f) => server.gpu_model!.startsWith(f.family));
    const key = family ? family.family : server.gpu_model!;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(server);
      if (deduped.length >= limit) break;
    }
  }

  return deduped;
}

export function getProviderGpuOverlap(slugA: string, slugB: string): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT s.gpu_model FROM servers s
    JOIN providers p ON s.provider_id = p.id
    WHERE p.slug = ? AND s.gpu_model IS NOT NULL AND s.available = 1
  `).all(slugA) as { gpu_model: string }[];
  const setA = new Set(rows.map((r) => r.gpu_model));

  const rowsB = db.prepare(`
    SELECT DISTINCT s.gpu_model FROM servers s
    JOIN providers p ON s.provider_id = p.id
    WHERE p.slug = ? AND s.gpu_model IS NOT NULL AND s.available = 1
  `).all(slugB) as { gpu_model: string }[];

  return rowsB.map((r) => r.gpu_model).filter((m) => setA.has(m));
}

export function upsertServer(server: Omit<Server, "created_at" | "updated_at">): void {
  const db = getDbWrite();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO servers (id, provider_id, name, cpu, cpu_cores, cpu_threads, ram_gb,
      storage_type, storage_gb, gpu_model, gpu_count, gpu_vram_gb, bandwidth_tb,
      price_monthly, price_hourly, currency, location, available, url, raw_data,
      scraped_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      cpu = excluded.cpu,
      cpu_cores = excluded.cpu_cores,
      cpu_threads = excluded.cpu_threads,
      ram_gb = excluded.ram_gb,
      storage_type = excluded.storage_type,
      storage_gb = excluded.storage_gb,
      gpu_model = excluded.gpu_model,
      gpu_count = excluded.gpu_count,
      gpu_vram_gb = excluded.gpu_vram_gb,
      bandwidth_tb = excluded.bandwidth_tb,
      price_monthly = excluded.price_monthly,
      price_hourly = excluded.price_hourly,
      currency = excluded.currency,
      available = excluded.available,
      url = excluded.url,
      raw_data = excluded.raw_data,
      scraped_at = excluded.scraped_at,
      updated_at = ?
  `);

  stmt.run(
    server.id, server.provider_id, server.name, server.cpu, server.cpu_cores,
    server.cpu_threads, server.ram_gb, server.storage_type, server.storage_gb,
    server.gpu_model, server.gpu_count, server.gpu_vram_gb, server.bandwidth_tb,
    server.price_monthly, server.price_hourly, server.currency, server.location,
    server.available, server.url, server.raw_data, server.scraped_at, now, now, now
  );
}

export function recordPriceHistory(serverId: string, priceMonthly: number | null, priceHourly: number | null, available: number): void {
  const db = getDbWrite();
  db.prepare(
    `INSERT INTO price_history (server_id, price_monthly, price_hourly, available, recorded_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(serverId, priceMonthly, priceHourly, available, new Date().toISOString());
}
