import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Latitude.sh bare metal GPU servers — https://www.latitude.sh/pricing
// Public pricing API: https://api.latitude.sh/plans

interface LatitudePlan {
  id: string;
  slug: string;
  name: string;
  specs: {
    cpus: Array<{ count: number; cores: number; model: string }>;
    memory: { total: number };
    drives: Array<{ count: number; size: number; type: string }>;
    nics: Array<{ count: number; bandwidth: string }>;
    gpu?: {
      type: string;
      count: number;
      memory: string;
    };
  };
  pricing: {
    "USD"?: { hourly?: string; monthly?: string };
  };
}

const FALLBACK_INSTANCES = [
  { gpu: "NVIDIA H100 SXM5", vram: 80,  count: 8,  price_hr: 19.60, cpu_cores: 192, ram: 1536, location: "US" },
  { gpu: "NVIDIA H100 PCIe", vram: 80,  count: 8,  price_hr: 15.68, cpu_cores: 192, ram: 1536, location: "US" },
  { gpu: "NVIDIA A100 PCIe", vram: 80,  count: 8,  price_hr: 11.20, cpu_cores: 128, ram: 1024, location: "US" },
  { gpu: "NVIDIA A100 PCIe", vram: 40,  count: 4,  price_hr: 4.48,  cpu_cores: 64,  ram: 512,  location: "US" },
  { gpu: "NVIDIA RTX 4090",  vram: 24,  count: 8,  price_hr: 8.00,  cpu_cores: 64,  ram: 512,  location: "US" },
  { gpu: "NVIDIA RTX 4090",  vram: 24,  count: 4,  price_hr: 4.00,  cpu_cores: 32,  ram: 256,  location: "US" },
  { gpu: "NVIDIA RTX 3090",  vram: 24,  count: 8,  price_hr: 4.80,  cpu_cores: 64,  ram: 512,  location: "US" },
  { gpu: "NVIDIA L40S",      vram: 48,  count: 4,  price_hr: 5.60,  cpu_cores: 64,  ram: 512,  location: "US" },
  { gpu: "NVIDIA L40S",      vram: 48,  count: 8,  price_hr: 11.20, cpu_cores: 128, ram: 1024, location: "US" },
];

export async function scrapeLatitude(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  // Try live API first
  let instances = FALLBACK_INSTANCES;
  try {
    const res = await fetch("https://api.latitude.sh/plans?filter[has_gpu]=true", {
      headers: { "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)" },
    });
    if (res.ok) {
      const data = await res.json();
      const plans: LatitudePlan[] = data?.data ?? [];
      const liveInstances: typeof FALLBACK_INSTANCES = [];

      for (const plan of plans) {
        const gpu = plan.specs?.gpu;
        if (!gpu) continue;
        const pricingUSD = plan.pricing?.["USD"];
        const priceHr = pricingUSD?.hourly ? parseFloat(pricingUSD.hourly) : null;
        if (!priceHr) continue;

        const totalCores = plan.specs.cpus?.reduce((s, c) => s + c.count * c.cores, 0) ?? 0;
        const ram = Math.round((plan.specs.memory?.total ?? 0) / 1024);
        const vramMatch = gpu.memory?.match(/(\d+)/);
        const vram = vramMatch ? parseInt(vramMatch[1]) : 80;

        liveInstances.push({
          gpu: `NVIDIA ${gpu.type}`,
          vram,
          count: gpu.count,
          price_hr: priceHr,
          cpu_cores: totalCores,
          ram,
          location: "US",
        });
      }

      if (liveInstances.length > 0) instances = liveInstances;
    }
  } catch {
    errors.push("Latitude API unavailable, using fallback pricing");
  }

  for (const inst of instances) {
    const idKey = `${inst.gpu}-${inst.count}x-${inst.vram}gb`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `latitude-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "latitude",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://www.latitude.sh/pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Latitude upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "latitude", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
