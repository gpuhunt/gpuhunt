import { upsertServer } from "../db";
import { ScraperResult } from "../types";

// RunPod exposes GPU pricing via their GraphQL API (no auth for public data)
const RUNPOD_API = "https://api.runpod.io/graphql";

const QUERY = `
  query GpuTypes {
    gpuTypes {
      id
      displayName
      memoryInGb
      secureCloud
      communityCloud
      lowestPrice(input: { gpuCount: 1 }) {
        minimumBidPrice
        uninterruptablePrice
      }
      secureSpotPrice
    }
  }
`;

interface RunPodGpuPrice {
  minimumBidPrice: number | null;
  uninterruptablePrice: number | null;
}

interface RunPodGpuType {
  id: string;
  displayName: string;
  memoryInGb: number;
  secureCloud: boolean;
  communityCloud: boolean;
  lowestPrice: RunPodGpuPrice | null;
  secureSpotPrice: number | null;
}

interface RunPodResponse {
  data: {
    gpuTypes: RunPodGpuType[];
  };
}

function normalizeRunpodGpu(name: string): string | null {
  const u = name.toUpperCase();
  // AMD Instinct
  if (u.includes("MI300X")) return "AMD Instinct MI300X";
  if (u.includes("MI325X")) return "AMD Instinct MI325X";
  if (u.includes("MI250"))  return "AMD Instinct MI250X";
  // NVIDIA flagship
  if (u.includes("H200"))   return "NVIDIA H200";
  if (u.includes("H100"))   return "NVIDIA H100";
  if (u.includes("A100"))   return "NVIDIA A100";
  // NVIDIA pro
  if (u.includes("L40S"))   return "NVIDIA L40S";
  if (u.includes("L40"))    return "NVIDIA L40";
  if (u.includes("L4"))     return "NVIDIA L4";
  if (u.includes("A40"))    return "NVIDIA A40";
  if (u.includes("A6000"))  return "NVIDIA RTX A6000";
  if (u.includes("A5000"))  return "NVIDIA RTX A5000";
  if (u.includes("A4000"))  return "NVIDIA RTX A4000";
  if (u.includes("A10G"))   return "NVIDIA A10G";
  if (u.includes("A10"))    return "NVIDIA A10";
  if (u.includes("A30"))    return "NVIDIA A30";
  if (u.includes("V100"))   return "NVIDIA V100";
  // High-end consumer (valid for AI)
  if (u.includes("RTX 6000 ADA") || u.includes("RTX6000")) return "NVIDIA RTX 6000 Ada";
  if (u.includes("RTX 5090"))   return "NVIDIA RTX 5090";
  if (u.includes("RTX 5080"))   return "NVIDIA RTX 5080";
  if (u.includes("RTX 4090"))   return "NVIDIA RTX 4090";
  if (u.includes("RTX 4080"))   return "NVIDIA RTX 4080";
  if (u.includes("RTX 3090"))   return "NVIDIA RTX 3090";
  if (u.includes("RTX 3080"))   return "NVIDIA RTX 3080";
  // Skip everything else (older consumer cards, Quadro P-series, etc.)
  return null;
}

export async function scrapeRunPod(): Promise<ScraperResult> {
  const result: ScraperResult = {
    provider_id: "runpod",
    servers_found: 0,
    servers_updated: 0,
    errors: [],
    duration_ms: 0,
  };

  const start = Date.now();

  try {
    const res = await fetch(RUNPOD_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "gpu-hunt.com server aggregator (support@gpu-hunt.com)",
      },
      body: JSON.stringify({ query: QUERY }),
    });

    if (!res.ok) throw new Error(`RunPod API returned ${res.status}`);

    const data: RunPodResponse = await res.json();
    const gpuTypes = data?.data?.gpuTypes ?? [];
    result.servers_found = gpuTypes.length;

    for (const gpu of gpuTypes) {
      try {
        const priceHourly =
          gpu.lowestPrice?.uninterruptablePrice ??
          gpu.lowestPrice?.minimumBidPrice ??
          null;

        const priceMonthly = priceHourly ? parseFloat((priceHourly * 730).toFixed(2)) : null;

        // Skip if no pricing
        if (!priceHourly) continue;

        const gpuModel = normalizeRunpodGpu(gpu.displayName);
        if (!gpuModel) continue; // skip unrecognized or consumer GPUs

        upsertServer({
          id: `runpod-${gpu.id}-1x`,
          provider_id: "runpod",
          name: `1x ${gpu.displayName}`,
          cpu: null,
          cpu_cores: null,
          cpu_threads: null,
          ram_gb: null,
          storage_type: null,
          storage_gb: null,
          gpu_model: gpuModel,
          gpu_count: 1,
          gpu_vram_gb: gpu.memoryInGb ?? null,
          bandwidth_tb: null,
          price_monthly: priceMonthly,
          price_hourly: priceHourly,
          currency: "USD",
          location: "Global",
          available: 1,
          url: "https://www.runpod.io/gpu-instance/pricing?utm_source=gpuhunt",
          raw_data: JSON.stringify(gpu),
          scraped_at: new Date().toISOString(),
        });

        result.servers_updated++;
      } catch (err) {
        result.errors.push(`Failed to parse RunPod GPU ${gpu.id}: ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`RunPod scraper failed: ${err}`);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
