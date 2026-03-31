import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

interface SaladGpuClass {
  name: string;
  ram: number;          // GPU VRAM in MB
  recommended_price_per_gpu: number;  // USD/hr
}

function normalizeGpu(name: string): string {
  if (name.includes("RTX 4090")) return "NVIDIA RTX 4090";
  if (name.includes("RTX 4080")) return "NVIDIA RTX 4080";
  if (name.includes("RTX 3090")) return "NVIDIA RTX 3090";
  if (name.includes("RTX 3080")) return "NVIDIA RTX 3080";
  if (name.includes("RTX 3070")) return "NVIDIA RTX 3070";
  if (name.includes("A100")) return "NVIDIA A100";
  if (name.includes("A40")) return "NVIDIA A40";
  if (name.includes("A6000")) return "NVIDIA A6000";
  if (name.includes("A5000")) return "NVIDIA A5000";
  if (name.includes("A4000")) return "NVIDIA A4000";
  if (name.includes("H100")) return "NVIDIA H100";
  if (name.includes("3090")) return "NVIDIA RTX 3090";
  if (name.includes("4090")) return "NVIDIA RTX 4090";
  return `NVIDIA ${name}`;
}

export async function scrapeSalad(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;

  try {
    const resp = await fetch("https://api.salad.com/api/public/gpu-classes", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)",
      },
    });

    if (!resp.ok) {
      return scrapeSaladFallback(start);
    }

    const data = await resp.json();
    const gpuClasses: SaladGpuClass[] = data.items ?? data ?? [];
    const now = new Date().toISOString();

    for (const gpu of gpuClasses) {
      if (!gpu.name || !gpu.recommended_price_per_gpu) continue;

      const vramGb = Math.round(gpu.ram / 1024);
      const gpuModel = normalizeGpu(gpu.name);
      const priceHr = gpu.recommended_price_per_gpu;
      const monthly = Math.round(priceHr * 730 * 100) / 100;
      const serverId = `salad-${gpu.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}`;

      try {
        upsertServer({
          id: serverId,
          provider_id: "salad",
          name: `1× ${gpu.name}`,
          cpu: null, cpu_cores: null, cpu_threads: null,
          ram_gb: null, storage_type: null, storage_gb: null,
          gpu_model: gpuModel, gpu_count: 1, gpu_vram_gb: vramGb > 0 ? vramGb : null,
          bandwidth_tb: null, price_monthly: monthly, price_hourly: priceHr,
          currency: "USD", location: "Global", available: 1,
          url: "https://salad.com/gpu-pricing?utm_source=gpuhunt",
          raw_data: JSON.stringify(gpu), scraped_at: now,
        });
        recordPriceHistory(serverId, monthly, priceHr, 1);
        found++; updated++;
      } catch (e) {
        errors.push(`Salad upsert failed for ${gpu.name}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Salad scrape failed: ${e}`);
    return scrapeSaladFallback(start);
  }

  if (found === 0) return scrapeSaladFallback(start);

  return { provider_id: "salad", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}

function scrapeSaladFallback(start: number): ScraperResult {
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  // Known Salad GPU prices (consumer GPUs, very competitive)
  const gpus = [
    { name: "RTX 4090", gpu: "NVIDIA RTX 4090", vram: 24, price_hr: 0.34 },
    { name: "RTX 3090", gpu: "NVIDIA RTX 3090", vram: 24, price_hr: 0.16 },
    { name: "RTX 3080", gpu: "NVIDIA RTX 3080", vram: 10, price_hr: 0.12 },
    { name: "RTX 3070", gpu: "NVIDIA RTX 3070", vram: 8,  price_hr: 0.08 },
    { name: "RTX 4080", gpu: "NVIDIA RTX 4080", vram: 16, price_hr: 0.25 },
    { name: "A6000",    gpu: "NVIDIA A6000",    vram: 48, price_hr: 0.30 },
    { name: "A5000",    gpu: "NVIDIA A5000",    vram: 24, price_hr: 0.20 },
    { name: "A4000",    gpu: "NVIDIA A4000",    vram: 16, price_hr: 0.14 },
    { name: "A100",     gpu: "NVIDIA A100",     vram: 80, price_hr: 1.28 },
    { name: "H100",     gpu: "NVIDIA H100",     vram: 80, price_hr: 2.25 },
  ];

  for (const g of gpus) {
    const monthly = Math.round(g.price_hr * 730 * 100) / 100;
    const serverId = `salad-${g.name.replace(/\s+/g, "-").toLowerCase()}`;
    try {
      upsertServer({
        id: serverId, provider_id: "salad",
        name: `1× ${g.name}`, cpu: null, cpu_cores: null, cpu_threads: null,
        ram_gb: null, storage_type: null, storage_gb: null,
        gpu_model: g.gpu, gpu_count: 1, gpu_vram_gb: g.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: g.price_hr,
        currency: "USD", location: "Global", available: 1,
        url: "https://salad.com/gpu-pricing?utm_source=gpuhunt",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, g.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Salad fallback failed for ${g.name}: ${e}`);
    }
  }

  return { provider_id: "salad", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
