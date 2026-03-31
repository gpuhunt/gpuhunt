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
          gpu_model: gpu.displayName,
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
