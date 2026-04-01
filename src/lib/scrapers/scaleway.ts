import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Scaleway GPU Instances — https://www.scaleway.com/en/pricing/gpu/
// Prices in EUR, stored as EUR. Located in Paris (EU).
const SCALEWAY_INSTANCES = [
  // L4 instances
  { gpu: "NVIDIA L4",         vram: 24, count: 1, price_hr_eur: 0.75,  cpu_cores: 8,   ram: 48,   location: "EU-FR" },
  { gpu: "NVIDIA L4",         vram: 24, count: 2, price_hr_eur: 1.50,  cpu_cores: 16,  ram: 96,   location: "EU-FR" },
  { gpu: "NVIDIA L4",         vram: 24, count: 4, price_hr_eur: 3.00,  cpu_cores: 32,  ram: 192,  location: "EU-FR" },
  { gpu: "NVIDIA L4",         vram: 24, count: 8, price_hr_eur: 6.00,  cpu_cores: 64,  ram: 384,  location: "EU-FR" },
  // L40S instances
  { gpu: "NVIDIA L40S",       vram: 48, count: 1, price_hr_eur: 1.49,  cpu_cores: 12,  ram: 96,   location: "EU-FR" },
  { gpu: "NVIDIA L40S",       vram: 48, count: 2, price_hr_eur: 2.98,  cpu_cores: 24,  ram: 192,  location: "EU-FR" },
  { gpu: "NVIDIA L40S",       vram: 48, count: 4, price_hr_eur: 5.96,  cpu_cores: 48,  ram: 384,  location: "EU-FR" },
  { gpu: "NVIDIA L40S",       vram: 48, count: 8, price_hr_eur: 11.92, cpu_cores: 96,  ram: 768,  location: "EU-FR" },
  // H100 SXM5 instances
  { gpu: "NVIDIA H100 SXM5",  vram: 80, count: 1, price_hr_eur: 2.99,  cpu_cores: 28,  ram: 120,  location: "EU-FR" },
  { gpu: "NVIDIA H100 SXM5",  vram: 80, count: 2, price_hr_eur: 5.98,  cpu_cores: 56,  ram: 240,  location: "EU-FR" },
  { gpu: "NVIDIA H100 SXM5",  vram: 80, count: 4, price_hr_eur: 11.96, cpu_cores: 112, ram: 480,  location: "EU-FR" },
  { gpu: "NVIDIA H100 SXM5",  vram: 80, count: 8, price_hr_eur: 23.92, cpu_cores: 224, ram: 960,  location: "EU-FR" },
  // Tesla P100 (legacy render)
  { gpu: "NVIDIA Tesla P100", vram: 16, count: 1, price_hr_eur: 1.22,  cpu_cores: 10,  ram: 42,   location: "EU-FR" },
];

export async function scrapeScaleway(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of SCALEWAY_INSTANCES) {
    const monthly = Math.round(inst.price_hr_eur * 730 * 100) / 100;
    const idKey = `${inst.gpu}-${inst.count}x`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `scaleway-${idKey}`;

    try {
      upsertServer({
        id: serverId,
        provider_id: "scaleway",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr_eur,
        currency: "EUR", location: inst.location, available: 1,
        url: "https://www.scaleway.com/en/pricing/gpu/",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr_eur, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Scaleway upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "scaleway", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
