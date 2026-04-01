import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Thunder Compute — https://thundercompute.com/pricing
// Cheapest H100 PCIe on the market ($1.38/hr). Multi-GPU via NVLink add-on.
const THUNDER_INSTANCES = [
  // Prototyping (pay-as-you-go)
  { gpu: "NVIDIA RTX A6000",  vram: 48, count: 1, price_hr: 0.27, cpu_cores: 4,  ram: 24,  location: "US", tier: "on-demand" },
  { gpu: "NVIDIA A100 PCIe",  vram: 80, count: 1, price_hr: 0.78, cpu_cores: 4,  ram: 24,  location: "US", tier: "on-demand" },
  { gpu: "NVIDIA H100 PCIe",  vram: 80, count: 1, price_hr: 1.38, cpu_cores: 4,  ram: 24,  location: "US", tier: "on-demand" },
  // Production (NVLink configs)
  { gpu: "NVIDIA A100 PCIe",  vram: 80, count: 8, price_hr: 14.32, cpu_cores: 32, ram: 192, location: "US", tier: "production" },
  { gpu: "NVIDIA H100 PCIe",  vram: 80, count: 8, price_hr: 19.92, cpu_cores: 32, ram: 192, location: "US", tier: "production" },
];

export async function scrapeThunderCompute(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of THUNDER_INSTANCES) {
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;
    const idKey = `${inst.gpu}-${inst.count}x-${inst.tier}`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `thundercompute-${idKey}`;

    try {
      upsertServer({
        id: serverId,
        provider_id: "thundercompute",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "SSD", storage_gb: 100,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://thundercompute.com/pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`ThunderCompute upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "thundercompute", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
