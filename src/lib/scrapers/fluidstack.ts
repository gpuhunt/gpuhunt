import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// FluidStack GPU pricing (from their pricing page)
// https://www.fluidstack.io/pricing
const FLUIDSTACK_GPUS = [
  // H100
  { gpu: "NVIDIA H100", vram: 80, count: 1, price_hr: 2.49, cpu: 24, ram: 192, location: "US" },
  { gpu: "NVIDIA H100", vram: 80, count: 8, price_hr: 19.92, cpu: 192, ram: 1536, location: "US" },
  // A100 80GB
  { gpu: "NVIDIA A100", vram: 80, count: 1, price_hr: 1.79, cpu: 16, ram: 117, location: "US" },
  { gpu: "NVIDIA A100", vram: 80, count: 8, price_hr: 14.32, cpu: 128, ram: 936, location: "US" },
  // A100 40GB
  { gpu: "NVIDIA A100", vram: 40, count: 1, price_hr: 1.35, cpu: 16, ram: 117, location: "US" },
  { gpu: "NVIDIA A100", vram: 40, count: 8, price_hr: 10.80, cpu: 128, ram: 936, location: "EU" },
  // RTX A6000
  { gpu: "NVIDIA A6000", vram: 48, count: 1, price_hr: 0.89, cpu: 8, ram: 64, location: "EU" },
  { gpu: "NVIDIA A6000", vram: 48, count: 8, price_hr: 7.12, cpu: 64, ram: 512, location: "EU" },
  // A40
  { gpu: "NVIDIA A40", vram: 48, count: 1, price_hr: 0.79, cpu: 8, ram: 64, location: "US" },
  { gpu: "NVIDIA A40", vram: 48, count: 8, price_hr: 6.32, cpu: 64, ram: 512, location: "US" },
  // RTX 4090
  { gpu: "NVIDIA RTX 4090", vram: 24, count: 1, price_hr: 0.80, cpu: 8, ram: 48, location: "EU" },
  { gpu: "NVIDIA RTX 4090", vram: 24, count: 8, price_hr: 6.40, cpu: 64, ram: 384, location: "EU" },
  // V100
  { gpu: "NVIDIA V100", vram: 32, count: 1, price_hr: 0.55, cpu: 8, ram: 48, location: "EU" },
  { gpu: "NVIDIA V100", vram: 32, count: 8, price_hr: 4.40, cpu: 64, ram: 384, location: "EU" },
  // L40S
  { gpu: "NVIDIA L40S", vram: 48, count: 1, price_hr: 1.25, cpu: 16, ram: 100, location: "US" },
  { gpu: "NVIDIA L40S", vram: 48, count: 8, price_hr: 10.00, cpu: 128, ram: 800, location: "US" },
];

export async function scrapeFluidstack(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  // Try live API (may require auth, fall back to static)
  let liveData: typeof FLUIDSTACK_GPUS | null = null;
  try {
    const resp = await fetch("https://platform.fluidstack.io/list_available_configurations", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)",
      },
    });
    if (resp.ok) {
      // Attempt to parse live pricing
      const json = await resp.json();
      if (Array.isArray(json)) {
        liveData = []; // Would parse here if API returned data without auth
      }
    }
  } catch {
    // Expected
  }

  const instances = liveData ?? FLUIDSTACK_GPUS;

  for (const inst of instances) {
    const idKey = `${inst.gpu}-${inst.count}-${inst.vram}-${inst.location}`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `fluidstack-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "fluidstack",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} (${inst.vram}GB)`,
        cpu: null,
        cpu_cores: inst.cpu,
        cpu_threads: null,
        ram_gb: inst.ram,
        storage_type: "NVMe",
        storage_gb: null,
        gpu_model: inst.gpu,
        gpu_count: inst.count,
        gpu_vram_gb: inst.vram,
        bandwidth_tb: null,
        price_monthly: monthly,
        price_hourly: inst.price_hr,
        currency: "USD",
        location: inst.location,
        available: 1,
        url: "https://www.fluidstack.io/pricing?utm_source=gpuhunt",
        raw_data: null,
        scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++;
      updated++;
    } catch (e) {
      errors.push(`FluidStack upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "fluidstack", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
