import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// CoreWeave GPU cloud pricing — https://www.coreweave.com/pricing
// On-demand rates as of 2026-Q1
const COREWEAVE_INSTANCES = [
  // B200 (Blackwell)
  { gpu: "NVIDIA B200", vram: 192, count: 1,  price_hr: 8.50,  cpu_cores: 32,  ram: 256,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA B200", vram: 192, count: 8,  price_hr: 68.00, cpu_cores: 256, ram: 2048, storage: "NVMe", location: "US" },
  // H200
  { gpu: "NVIDIA H200 SXM", vram: 141, count: 1,  price_hr: 4.25,  cpu_cores: 26,  ram: 200,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA H200 SXM", vram: 141, count: 8,  price_hr: 34.00, cpu_cores: 208, ram: 1600, storage: "NVMe", location: "US" },
  // H100
  { gpu: "NVIDIA H100 SXM5", vram: 80, count: 1,  price_hr: 2.99,  cpu_cores: 26,  ram: 200,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA H100 SXM5", vram: 80, count: 8,  price_hr: 23.92, cpu_cores: 208, ram: 1600, storage: "NVMe", location: "US" },
  { gpu: "NVIDIA H100 PCIe", vram: 80, count: 1,  price_hr: 2.39,  cpu_cores: 20,  ram: 160,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA H100 PCIe", vram: 80, count: 8,  price_hr: 19.12, cpu_cores: 160, ram: 1280, storage: "NVMe", location: "US" },
  // A100
  { gpu: "NVIDIA A100 SXM4", vram: 80, count: 1,  price_hr: 2.06,  cpu_cores: 30,  ram: 200,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA A100 SXM4", vram: 80, count: 8,  price_hr: 16.48, cpu_cores: 240, ram: 1600, storage: "NVMe", location: "US" },
  { gpu: "NVIDIA A100 PCIe", vram: 40, count: 1,  price_hr: 1.79,  cpu_cores: 24,  ram: 192,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA A100 PCIe", vram: 80, count: 1,  price_hr: 1.99,  cpu_cores: 24,  ram: 192,  storage: "NVMe", location: "US" },
  // L40S
  { gpu: "NVIDIA L40S", vram: 48, count: 1,  price_hr: 1.69,  cpu_cores: 16,  ram: 120,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA L40S", vram: 48, count: 8,  price_hr: 13.52, cpu_cores: 128, ram: 960,  storage: "NVMe", location: "US" },
  // A40
  { gpu: "NVIDIA A40", vram: 48, count: 1,  price_hr: 0.99,  cpu_cores: 16,  ram: 128,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA A40", vram: 48, count: 8,  price_hr: 7.92,  cpu_cores: 128, ram: 1024, storage: "NVMe", location: "US" },
  // RTX A6000
  { gpu: "NVIDIA RTX A6000", vram: 48, count: 1,  price_hr: 0.89,  cpu_cores: 12,  ram: 96,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA RTX A6000", vram: 48, count: 4,  price_hr: 3.56,  cpu_cores: 48,  ram: 384, storage: "NVMe", location: "US" },
  // V100
  { gpu: "NVIDIA V100", vram: 16, count: 1,  price_hr: 0.55,  cpu_cores: 8,   ram: 64,  storage: "NVMe", location: "US" },
  { gpu: "NVIDIA V100", vram: 32, count: 1,  price_hr: 0.69,  cpu_cores: 8,   ram: 64,  storage: "NVMe", location: "US" },
];

export async function scrapeCoreWeave(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of COREWEAVE_INSTANCES) {
    const idKey = `${inst.gpu}-${inst.count}x-${inst.vram}gb`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `coreweave-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "coreweave",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: inst.storage, storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://www.coreweave.com/pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`CoreWeave upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "coreweave", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
