import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

interface GenesisInstanceType {
  id: string;
  name: string;
  gpu_model?: string;
  gpu_count?: number;
  vram_per_gpu_gb?: number;
  cpu_cores?: number;
  ram_gb?: number;
  storage_size_gb?: number;
  price?: { per_hour?: number };
  status?: string;
  location?: string;
}

function normalizeGpu(name: string): string {
  if (name.includes("RTX 3080")) return "NVIDIA RTX 3080";
  if (name.includes("RTX 3090")) return "NVIDIA RTX 3090";
  if (name.includes("RTX 4090")) return "NVIDIA RTX 4090";
  if (name.includes("A100")) return "NVIDIA A100";
  if (name.includes("H100")) return "NVIDIA H100";
  if (name.includes("A10")) return "NVIDIA A10";
  if (name.includes("A40")) return "NVIDIA A40";
  if (name.includes("V100")) return "NVIDIA V100";
  return `NVIDIA ${name}`;
}

export async function scrapeGenesis(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;

  try {
    const resp = await fetch("https://api.genesiscloud.com/compute/v1/instance-types", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)",
      },
    });

    if (!resp.ok) {
      // Fall back to known pricing
      return scrapeGenesisFallback(start);
    }

    const data = await resp.json();
    const instanceTypes: GenesisInstanceType[] = data.instance_types ?? data.data ?? [];
    const now = new Date().toISOString();

    for (const it of instanceTypes) {
      if (!it.gpu_model && !it.name?.toLowerCase().includes("gpu")) continue;
      const priceHr = it.price?.per_hour ?? 0;
      if (priceHr <= 0) continue;

      const gpuModel = normalizeGpu(it.gpu_model ?? it.name);
      const monthly = Math.round(priceHr * 730 * 100) / 100;
      const serverId = `genesis-${it.id}`;

      try {
        upsertServer({
          id: serverId,
          provider_id: "genesis",
          name: it.name,
          cpu: null,
          cpu_cores: it.cpu_cores ?? null,
          cpu_threads: null,
          ram_gb: it.ram_gb ?? null,
          storage_type: "NVMe",
          storage_gb: it.storage_size_gb ?? null,
          gpu_model: gpuModel,
          gpu_count: it.gpu_count ?? 1,
          gpu_vram_gb: it.vram_per_gpu_gb ?? null,
          bandwidth_tb: null,
          price_monthly: monthly,
          price_hourly: priceHr,
          currency: "USD",
          location: "EU",
          available: 1,
          url: "https://www.genesiscloud.com/pricing?utm_source=gpuhunt",
          raw_data: JSON.stringify(it),
          scraped_at: now,
        });
        recordPriceHistory(serverId, monthly, priceHr, 1);
        found++;
        updated++;
      } catch (e) {
        errors.push(`Genesis upsert failed for ${it.id}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Genesis API failed: ${e}`);
    return scrapeGenesisFallback(start);
  }

  return { provider_id: "genesis", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}

function scrapeGenesisFallback(start: number): ScraperResult {
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  const instances = [
    { id: "vcpu-4_memory-12g_nvidia-rtx-3080-1", name: "1× RTX 3080 10GB", gpu: "NVIDIA RTX 3080", count: 1, vram: 10, cpu: 4, ram: 12, price_hr: 0.49 },
    { id: "vcpu-8_memory-24g_nvidia-rtx-3080-2", name: "2× RTX 3080 10GB", gpu: "NVIDIA RTX 3080", count: 2, vram: 10, cpu: 8, ram: 24, price_hr: 0.98 },
    { id: "vcpu-16_memory-48g_nvidia-rtx-3080-4", name: "4× RTX 3080 10GB", gpu: "NVIDIA RTX 3080", count: 4, vram: 10, cpu: 16, ram: 48, price_hr: 1.96 },
    { id: "vcpu-8_memory-24g_nvidia-rtx-3090-1", name: "1× RTX 3090 24GB", gpu: "NVIDIA RTX 3090", count: 1, vram: 24, cpu: 8, ram: 24, price_hr: 0.99 },
    { id: "vcpu-32_memory-192g_nvidia-a100-1", name: "1× A100 80GB", gpu: "NVIDIA A100", count: 1, vram: 80, cpu: 32, ram: 192, price_hr: 2.99 },
  ];

  for (const inst of instances) {
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;
    const serverId = `genesis-${inst.id}`;
    try {
      upsertServer({
        id: serverId,
        provider_id: "genesis",
        name: inst.name,
        cpu: null, cpu_cores: inst.cpu, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: "EU", available: 1,
        url: "https://www.genesiscloud.com/pricing?utm_source=gpuhunt",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Genesis fallback upsert failed: ${e}`);
    }
  }

  return { provider_id: "genesis", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
