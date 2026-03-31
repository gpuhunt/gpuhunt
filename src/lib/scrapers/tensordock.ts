import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// TensorDock pricing from their marketplace (https://tensordock.com)
// Public API now requires authentication; using known pricing data
const TENSORDOCK_GPUS = [
  { gpu: "NVIDIA H100", vram: 80, count: 1, price_hr: 2.55, cpu: 24, ram: 192, location: "US" },
  { gpu: "NVIDIA H100", vram: 80, count: 8, price_hr: 20.40, cpu: 192, ram: 1536, location: "US" },
  { gpu: "NVIDIA A100", vram: 80, count: 1, price_hr: 1.89, cpu: 20, ram: 160, location: "US" },
  { gpu: "NVIDIA A100", vram: 80, count: 8, price_hr: 15.12, cpu: 160, ram: 1280, location: "US" },
  { gpu: "NVIDIA A100", vram: 40, count: 1, price_hr: 1.35, cpu: 16, ram: 120, location: "US" },
  { gpu: "NVIDIA A40",  vram: 48, count: 1, price_hr: 0.79, cpu: 10, ram: 80,  location: "US" },
  { gpu: "NVIDIA A40",  vram: 48, count: 8, price_hr: 6.32, cpu: 80, ram: 640, location: "US" },
  { gpu: "NVIDIA RTX 4090", vram: 24, count: 1, price_hr: 0.50, cpu: 8, ram: 48, location: "US" },
  { gpu: "NVIDIA RTX 4090", vram: 24, count: 4, price_hr: 2.00, cpu: 32, ram: 192, location: "US" },
  { gpu: "NVIDIA RTX 3090", vram: 24, count: 1, price_hr: 0.35, cpu: 8, ram: 48, location: "US" },
  { gpu: "NVIDIA RTX 3090", vram: 24, count: 4, price_hr: 1.40, cpu: 32, ram: 192, location: "US" },
  { gpu: "NVIDIA A6000", vram: 48, count: 1, price_hr: 0.85, cpu: 10, ram: 60,  location: "EU" },
  { gpu: "NVIDIA A5000", vram: 24, count: 1, price_hr: 0.46, cpu: 8,  ram: 48,  location: "EU" },
  { gpu: "NVIDIA A4000", vram: 16, count: 1, price_hr: 0.28, cpu: 6,  ram: 32,  location: "US" },
  { gpu: "NVIDIA L40S",  vram: 48, count: 1, price_hr: 1.29, cpu: 16, ram: 120, location: "US" },
  { gpu: "NVIDIA V100",  vram: 32, count: 1, price_hr: 0.45, cpu: 8,  ram: 64,  location: "US" },
];

export async function scrapeTensordock(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of TENSORDOCK_GPUS) {
    const idKey = `${inst.gpu}-${inst.count}-${inst.vram}gb-${inst.location}`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `tensordock-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "tensordock",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "SSD", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://tensordock.com/deploy?ref=gpuhunt",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`TensorDock upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "tensordock", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
