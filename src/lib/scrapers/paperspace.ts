import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Paperspace (DigitalOcean) GPU cloud pricing — https://www.paperspace.com/pricing
// On-demand rates for GPU virtual machines as of 2026-Q1
const PAPERSPACE_INSTANCES = [
  // H100 SXM5
  { name: "A100-80G-SXM",  gpu: "NVIDIA A100 SXM4",   vram: 80,  count: 1, price_hr: 3.18,  cpu_cores: 12, ram: 90,  storage_gb: 50,  location: "US" },
  // A100 PCIe
  { name: "A100-80G",      gpu: "NVIDIA A100 PCIe",   vram: 80,  count: 1, price_hr: 2.30,  cpu_cores: 12, ram: 90,  storage_gb: 50,  location: "US" },
  // A100 40GB
  { name: "A100-40G",      gpu: "NVIDIA A100 PCIe",   vram: 40,  count: 1, price_hr: 1.71,  cpu_cores: 8,  ram: 45,  storage_gb: 50,  location: "US" },
  // RTX A6000
  { name: "RTX-A6000",     gpu: "NVIDIA RTX A6000",   vram: 48,  count: 1, price_hr: 1.89,  cpu_cores: 8,  ram: 45,  storage_gb: 50,  location: "US" },
  // A40
  { name: "A40",           gpu: "NVIDIA A40",         vram: 48,  count: 1, price_hr: 1.10,  cpu_cores: 8,  ram: 45,  storage_gb: 50,  location: "US" },
  // RTX A5000
  { name: "RTX-A5000",     gpu: "NVIDIA RTX A5000",   vram: 24,  count: 1, price_hr: 0.78,  cpu_cores: 8,  ram: 45,  storage_gb: 50,  location: "US" },
  // RTX A4000
  { name: "RTX-A4000",     gpu: "NVIDIA RTX A4000",   vram: 16,  count: 1, price_hr: 0.56,  cpu_cores: 8,  ram: 30,  storage_gb: 50,  location: "US" },
  // V100
  { name: "V100",          gpu: "NVIDIA V100",        vram: 16,  count: 1, price_hr: 2.30,  cpu_cores: 8,  ram: 30,  storage_gb: 50,  location: "US" },
  { name: "V100-32G",      gpu: "NVIDIA V100",        vram: 32,  count: 1, price_hr: 2.56,  cpu_cores: 8,  ram: 30,  storage_gb: 50,  location: "US" },
  // P5000 & P4000 (quadro)
  { name: "P5000",         gpu: "NVIDIA Quadro P5000",vram: 16,  count: 1, price_hr: 0.78,  cpu_cores: 8,  ram: 30,  storage_gb: 50,  location: "US" },
  { name: "P4000",         gpu: "NVIDIA Quadro P4000",vram: 8,   count: 1, price_hr: 0.51,  cpu_cores: 8,  ram: 30,  storage_gb: 50,  location: "US" },
  // Multi-GPU A100 nodes
  { name: "A100-80G-x8",   gpu: "NVIDIA A100 PCIe",  vram: 80,  count: 8, price_hr: 18.40, cpu_cores: 96, ram: 720, storage_gb: 500, location: "US" },
];

export async function scrapePaperspace(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  for (const inst of PAPERSPACE_INSTANCES) {
    const idKey = `${inst.name}`.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `paperspace-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "paperspace",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "SSD", storage_gb: inst.storage_gb,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://www.paperspace.com/pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Paperspace upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "paperspace", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
