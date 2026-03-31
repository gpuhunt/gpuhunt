import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";
import { v4 as uuidv4 } from "uuid";

interface VastOffer {
  id: number;
  num_gpus: number;
  gpu_name: string;
  gpu_ram: number;         // MB
  cpu_cores_effective: number;
  cpu_ram: number;         // GB
  disk_space: number;      // GB
  dph_total: number;       // $/hr on-demand
  dph_base: number;
  rentable: boolean;
  rented: boolean;
  geolocation: string;
  inet_up: number;
  inet_down: number;
  reliability2: number;
  machine_id: number;
}

const GPU_VRAM_MAP: Record<string, number> = {
  "RTX 4090": 24, "RTX 3090": 24, "RTX 3090 Ti": 24,
  "RTX 4080": 16, "RTX 3080": 10, "RTX 3080 Ti": 12,
  "A100 SXM4 80GB": 80, "A100 PCIe 80GB": 80, "A100 SXM4 40GB": 40, "A100 PCIe 40GB": 40,
  "H100 SXM5 80GB": 80, "H100 PCIe 80GB": 80, "H100 NVL": 94,
  "A40": 48, "A10": 24, "A6000": 48, "A5000": 24, "A4000": 16,
  "V100 SXM2 16GB": 16, "V100 PCIe 16GB": 16, "V100 SXM2 32GB": 32,
  "L40S": 48, "L40": 48, "L4": 24,
  "4090": 24, "3090": 24, "A100": 80, "H100": 80,
};

function normalizeGpuName(name: string): string {
  const n = name.trim();
  if (n.includes("H100")) return "NVIDIA H100";
  if (n.includes("A100")) return "NVIDIA A100";
  if (n.includes("A40"))  return "NVIDIA A40";
  if (n.includes("A6000")) return "NVIDIA A6000";
  if (n.includes("A10G")) return "NVIDIA A10G";
  if (n.includes("A10"))  return "NVIDIA A10";
  if (n.includes("L40S")) return "NVIDIA L40S";
  if (n.includes("L40"))  return "NVIDIA L40";
  if (n.includes("L4"))   return "NVIDIA L4";
  if (n.includes("V100")) return "NVIDIA V100";
  if (n.includes("RTX 4090")) return "NVIDIA RTX 4090";
  if (n.includes("RTX 3090")) return "NVIDIA RTX 3090";
  if (n.includes("RTX 3080")) return "NVIDIA RTX 3080";
  if (n.includes("RTX 4080")) return "NVIDIA RTX 4080";
  if (n.includes("4090")) return "NVIDIA RTX 4090";
  if (n.includes("3090")) return "NVIDIA RTX 3090";
  return `NVIDIA ${n}`;
}

function getVram(name: string): number | null {
  for (const [key, vram] of Object.entries(GPU_VRAM_MAP)) {
    if (name.includes(key)) return vram;
  }
  const m = name.match(/(\d+)\s*GB/i);
  return m ? parseInt(m[1]) : null;
}

export async function scrapeVast(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;

  try {
    // Search for rentable GPU offers, sorted by price
    const resp = await fetch(
      "https://console.vast.ai/api/v0/bundles/?q={%22rentable%22:{%22eq%22:true},%22num_gpus%22:{%22gte%22:1},%22order%22:[[%22dph_total%22,%22asc%22]],%22limit%22:500}",
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)",
        },
      }
    );

    if (!resp.ok) {
      errors.push(`Vast.ai API error: ${resp.status}`);
      return { provider_id: "vast", servers_found: 0, servers_updated: 0, errors, duration_ms: Date.now() - start };
    }

    const data = await resp.json();
    const offers: VastOffer[] = data.offers ?? [];

    // Deduplicate by gpu_name to get one listing per GPU type (cheapest)
    const seen = new Set<string>();

    for (const offer of offers) {
      if (!offer.rentable || !offer.gpu_name || offer.dph_total <= 0) continue;

      const gpuModel = normalizeGpuName(offer.gpu_name);
      const key = `${gpuModel}-${offer.num_gpus}`;

      // Keep one listing per GPU model + count combo (cheapest)
      if (seen.has(key)) continue;
      seen.add(key);

      const vram = getVram(offer.gpu_name);
      const hourly = offer.dph_total;
      const monthly = Math.round(hourly * 730 * 100) / 100;
      const serverId = `vast-${offer.machine_id}-${offer.num_gpus}g`;
      const now = new Date().toISOString();

      try {
        upsertServer({
          id: serverId,
          provider_id: "vast",
          name: `${offer.num_gpus}× ${offer.gpu_name}`,
          cpu: null,
          cpu_cores: Math.round(offer.cpu_cores_effective) || null,
          cpu_threads: null,
          ram_gb: Math.round(offer.cpu_ram) || null,
          storage_type: "SSD",
          storage_gb: Math.round(offer.disk_space) || null,
          gpu_model: gpuModel,
          gpu_count: offer.num_gpus,
          gpu_vram_gb: vram,
          bandwidth_tb: null,
          price_monthly: monthly,
          price_hourly: Math.round(hourly * 10000) / 10000,
          currency: "USD",
          location: offer.geolocation?.split(",")[1]?.trim() || offer.geolocation || null,
          available: 1,
          url: `https://vast.ai/console/create/?ref_id=gpuhunt&q=machineId%3D${offer.machine_id}`,
          raw_data: JSON.stringify({ machine_id: offer.machine_id, gpu_name: offer.gpu_name }),
          scraped_at: now,
        });
        recordPriceHistory(serverId, monthly, hourly, 1);
        found++;
        updated++;
      } catch (e) {
        errors.push(`Failed to upsert vast offer ${offer.machine_id}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Vast.ai scrape failed: ${e}`);
  }

  return { provider_id: "vast", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
