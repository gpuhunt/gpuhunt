import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// DigitalOcean GPU Droplets — https://www.digitalocean.com/pricing/gpu-droplets
// All configs are 8-GPU nodes; price shown is per-GPU/hr, we store total
const DO_INSTANCES = [
  // On-demand 8-GPU nodes
  { gpu: "AMD Instinct MI300X",  vram: 192, count: 8, price_hr_per_gpu: 1.99,  cpu_cores: 160, ram: 1920, location: "US" },
  { gpu: "NVIDIA H100 SXM5",    vram: 80,  count: 8, price_hr_per_gpu: 3.39,  cpu_cores: 160, ram: 1920, location: "US" },
  { gpu: "NVIDIA H200 SXM",     vram: 141, count: 8, price_hr_per_gpu: 3.44,  cpu_cores: 192, ram: 1920, location: "US" },
  { gpu: "NVIDIA RTX 4000 Ada", vram: 20,  count: 1, price_hr_per_gpu: 0.76,  cpu_cores: 8,   ram: 32,   location: "US" },
  { gpu: "NVIDIA RTX 6000 Ada", vram: 48,  count: 1, price_hr_per_gpu: 1.57,  cpu_cores: 8,   ram: 64,   location: "US" },
  { gpu: "NVIDIA L40S",         vram: 48,  count: 1, price_hr_per_gpu: 1.57,  cpu_cores: 8,   ram: 64,   location: "US" },
  // Reserved pricing shown as on-demand alternatives
  { gpu: "AMD Instinct MI325X", vram: 256, count: 8, price_hr_per_gpu: 2.10,  cpu_cores: 160, ram: 1920, location: "US" },
  { gpu: "NVIDIA B300 SXM",     vram: 192, count: 8, price_hr_per_gpu: 5.65,  cpu_cores: 224, ram: 3840, location: "US" },
];

export async function scrapeDigitalOcean(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of DO_INSTANCES) {
    const totalHr = Math.round(inst.price_hr_per_gpu * inst.count * 100) / 100;
    const monthly = Math.round(totalHr * 730 * 100) / 100;
    const idKey = `${inst.gpu}-${inst.count}x`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `digitalocean-${idKey}`;

    try {
      upsertServer({
        id: serverId,
        provider_id: "digitalocean",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "").replace("AMD Instinct ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: 720,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: totalHr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://www.digitalocean.com/pricing/gpu-droplets",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, totalHr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`DigitalOcean upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "digitalocean", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
