import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Jarvis Labs GPU cloud pricing — https://jarvislabs.ai/pricing
// On-demand rates as of 2026-Q1
const JARVISLABS_INSTANCES = [
  // H100 SXM5
  { gpu: "NVIDIA H100 SXM5", vram: 80,  count: 1,  price_hr: 2.79,  cpu_cores: 12, ram: 120, location: "US" },
  { gpu: "NVIDIA H100 SXM5", vram: 80,  count: 2,  price_hr: 5.58,  cpu_cores: 24, ram: 240, location: "US" },
  { gpu: "NVIDIA H100 SXM5", vram: 80,  count: 4,  price_hr: 11.16, cpu_cores: 48, ram: 480, location: "US" },
  { gpu: "NVIDIA H100 SXM5", vram: 80,  count: 8,  price_hr: 22.32, cpu_cores: 96, ram: 960, location: "US" },
  // H200 SXM
  { gpu: "NVIDIA H200 SXM",  vram: 141, count: 1,  price_hr: 3.99,  cpu_cores: 16, ram: 160, location: "US" },
  { gpu: "NVIDIA H200 SXM",  vram: 141, count: 8,  price_hr: 31.92, cpu_cores: 128, ram: 1280, location: "US" },
  // A100 SXM4
  { gpu: "NVIDIA A100 SXM4", vram: 80,  count: 1,  price_hr: 1.79,  cpu_cores: 12, ram: 120, location: "US" },
  { gpu: "NVIDIA A100 SXM4", vram: 80,  count: 2,  price_hr: 3.58,  cpu_cores: 24, ram: 240, location: "US" },
  { gpu: "NVIDIA A100 SXM4", vram: 80,  count: 4,  price_hr: 7.16,  cpu_cores: 48, ram: 480, location: "US" },
  { gpu: "NVIDIA A100 SXM4", vram: 80,  count: 8,  price_hr: 14.32, cpu_cores: 96, ram: 960, location: "US" },
  // RTX 6000 Ada
  { gpu: "NVIDIA RTX 6000",  vram: 48,  count: 1,  price_hr: 0.99,  cpu_cores: 8,  ram: 80,  location: "US" },
  { gpu: "NVIDIA RTX 6000",  vram: 48,  count: 4,  price_hr: 3.96,  cpu_cores: 32, ram: 320, location: "US" },
  // A5000
  { gpu: "NVIDIA RTX A5000", vram: 24,  count: 1,  price_hr: 0.49,  cpu_cores: 6,  ram: 50,  location: "US" },
  { gpu: "NVIDIA RTX A5000", vram: 24,  count: 4,  price_hr: 1.96,  cpu_cores: 24, ram: 200, location: "US" },
  // L4
  { gpu: "NVIDIA L4",        vram: 24,  count: 1,  price_hr: 0.49,  cpu_cores: 8,  ram: 60,  location: "US" },
  { gpu: "NVIDIA L4",        vram: 24,  count: 4,  price_hr: 1.96,  cpu_cores: 32, ram: 240, location: "US" },
];

export async function scrapeJarvisLabs(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of JARVISLABS_INSTANCES) {
    const idKey = `${inst.gpu}-${inst.count}x-${inst.vram}gb`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `jarvislabs-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "jarvislabs",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://jarvislabs.ai/pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`JarvisLabs upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "jarvislabs", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
