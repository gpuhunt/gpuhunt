import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Oblivus GPU Cloud — https://oblivus.com/pricing
// On-demand rates. Multi-GPU configs are per the node.
const OBLIVUS_INSTANCES = [
  // H200 SXM5 — per GPU pricing, 8-GPU nodes
  { gpu: "NVIDIA H200 SXM", vram: 141, count: 8,  price_hr: 31.92, cpu_cores: 224, ram: 1536, location: "EU" },
  // H100 SXM5 — 8-GPU nodes
  { gpu: "NVIDIA H100 SXM5", vram: 80, count: 8,  price_hr: 23.52, cpu_cores: 192, ram: 1800, location: "EU" },
  // H100 NVLink — multiple configs
  { gpu: "NVIDIA H100 NVLink", vram: 80, count: 1,  price_hr: 2.08,  cpu_cores: 31,  ram: 180,  location: "EU" },
  { gpu: "NVIDIA H100 NVLink", vram: 80, count: 2,  price_hr: 4.16,  cpu_cores: 63,  ram: 360,  location: "EU" },
  { gpu: "NVIDIA H100 NVLink", vram: 80, count: 4,  price_hr: 8.32,  cpu_cores: 126, ram: 720,  location: "EU" },
  { gpu: "NVIDIA H100 NVLink", vram: 80, count: 8,  price_hr: 16.64, cpu_cores: 252, ram: 1440, location: "EU" },
  // H100 PCIe
  { gpu: "NVIDIA H100 PCIe",  vram: 80, count: 1,  price_hr: 1.98,  cpu_cores: 28,  ram: 180,  location: "EU" },
  { gpu: "NVIDIA H100 PCIe",  vram: 80, count: 8,  price_hr: 15.84, cpu_cores: 252, ram: 1440, location: "EU" },
  // A100 NVLink
  { gpu: "NVIDIA A100 SXM4",  vram: 80, count: 1,  price_hr: 1.57,  cpu_cores: 31,  ram: 240,  location: "EU" },
  { gpu: "NVIDIA A100 SXM4",  vram: 80, count: 8,  price_hr: 12.56, cpu_cores: 252, ram: 1920, location: "EU" },
  // A100 PCIe
  { gpu: "NVIDIA A100 PCIe",  vram: 80, count: 1,  price_hr: 1.47,  cpu_cores: 28,  ram: 120,  location: "EU" },
  { gpu: "NVIDIA A100 PCIe",  vram: 80, count: 8,  price_hr: 11.76, cpu_cores: 252, ram: 1440, location: "EU" },
  // L40
  { gpu: "NVIDIA L40",        vram: 48, count: 1,  price_hr: 1.05,  cpu_cores: 28,  ram: 58,   location: "EU" },
  { gpu: "NVIDIA L40",        vram: 48, count: 4,  price_hr: 4.20,  cpu_cores: 112, ram: 232,  location: "EU" },
  { gpu: "NVIDIA L40",        vram: 48, count: 8,  price_hr: 8.40,  cpu_cores: 252, ram: 464,  location: "EU" },
  // RTX 4090
  { gpu: "NVIDIA RTX 4090",   vram: 24, count: 1,  price_hr: 0.64,  cpu_cores: 12,  ram: 70,   location: "EU" },
  { gpu: "NVIDIA RTX 4090",   vram: 24, count: 8,  price_hr: 5.12,  cpu_cores: 120, ram: 706,  location: "EU" },
  // RTX A6000
  { gpu: "NVIDIA RTX A6000",  vram: 48, count: 1,  price_hr: 0.55,  cpu_cores: 28,  ram: 58,   location: "EU" },
  { gpu: "NVIDIA RTX A6000",  vram: 48, count: 8,  price_hr: 4.40,  cpu_cores: 252, ram: 464,  location: "EU" },
];

export async function scrapeOblivus(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of OBLIVUS_INSTANCES) {
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;
    const idKey = `${inst.gpu}-${inst.count}x`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `oblivus-${idKey}`;

    try {
      upsertServer({
        id: serverId,
        provider_id: "oblivus",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://oblivus.com/pricing/",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Oblivus upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "oblivus", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
