import { v4 as uuid } from "uuid";
import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Lambda Labs public instance types
// They don't have a fully public catalog API, so we maintain known configs
// and scrape pricing from their site
const LAMBDA_INSTANCES = [
  {
    name: "gpu_1x_a100_sxm4",
    display: "1x A100 SXM4 (40 GB)",
    gpu_model: "NVIDIA A100 SXM4",
    gpu_count: 1,
    gpu_vram_gb: 40,
    cpu: "AMD EPYC Milan",
    cpu_cores: 30,
    ram_gb: 200,
    storage_gb: 512,
    storage_type: "NVMe",
    price_hourly: 1.10,
  },
  {
    name: "gpu_1x_a100_sxm4_80gb",
    display: "1x A100 SXM4 (80 GB)",
    gpu_model: "NVIDIA A100 SXM4",
    gpu_count: 1,
    gpu_vram_gb: 80,
    cpu: "AMD EPYC Milan",
    cpu_cores: 30,
    ram_gb: 200,
    storage_gb: 512,
    storage_type: "NVMe",
    price_hourly: 1.29,
  },
  {
    name: "gpu_2x_a100_sxm4_80gb",
    display: "2x A100 SXM4 (80 GB)",
    gpu_model: "NVIDIA A100 SXM4",
    gpu_count: 2,
    gpu_vram_gb: 80,
    cpu: "AMD EPYC Milan",
    cpu_cores: 60,
    ram_gb: 400,
    storage_gb: 1024,
    storage_type: "NVMe",
    price_hourly: 2.58,
  },
  {
    name: "gpu_4x_a100_sxm4_80gb",
    display: "4x A100 SXM4 (80 GB)",
    gpu_model: "NVIDIA A100 SXM4",
    gpu_count: 4,
    gpu_vram_gb: 80,
    cpu: "AMD EPYC Milan",
    cpu_cores: 120,
    ram_gb: 800,
    storage_gb: 2048,
    storage_type: "NVMe",
    price_hourly: 5.16,
  },
  {
    name: "gpu_8x_a100_sxm4_80gb",
    display: "8x A100 SXM4 (80 GB)",
    gpu_model: "NVIDIA A100 SXM4",
    gpu_count: 8,
    gpu_vram_gb: 80,
    cpu: "AMD EPYC Milan",
    cpu_cores: 240,
    ram_gb: 1800,
    storage_gb: 4096,
    storage_type: "NVMe",
    price_hourly: 10.32,
  },
  {
    name: "gpu_1x_h100_sxm5",
    display: "1x H100 SXM5 (80 GB)",
    gpu_model: "NVIDIA H100 SXM5",
    gpu_count: 1,
    gpu_vram_gb: 80,
    cpu: "Intel Xeon Platinum",
    cpu_cores: 26,
    ram_gb: 200,
    storage_gb: 512,
    storage_type: "NVMe",
    price_hourly: 2.49,
  },
  {
    name: "gpu_2x_h100_sxm5",
    display: "2x H100 SXM5 (80 GB)",
    gpu_model: "NVIDIA H100 SXM5",
    gpu_count: 2,
    gpu_vram_gb: 80,
    cpu: "Intel Xeon Platinum",
    cpu_cores: 52,
    ram_gb: 400,
    storage_gb: 1024,
    storage_type: "NVMe",
    price_hourly: 4.98,
  },
  {
    name: "gpu_4x_h100_sxm5",
    display: "4x H100 SXM5 (80 GB)",
    gpu_model: "NVIDIA H100 SXM5",
    gpu_count: 4,
    gpu_vram_gb: 80,
    cpu: "Intel Xeon Platinum",
    cpu_cores: 104,
    ram_gb: 800,
    storage_gb: 2048,
    storage_type: "NVMe",
    price_hourly: 9.96,
  },
  {
    name: "gpu_8x_h100_sxm5",
    display: "8x H100 SXM5 (80 GB)",
    gpu_model: "NVIDIA H100 SXM5",
    gpu_count: 8,
    gpu_vram_gb: 80,
    cpu: "Intel Xeon Platinum",
    cpu_cores: 208,
    ram_gb: 1800,
    storage_gb: 4096,
    storage_type: "NVMe",
    price_hourly: 19.92,
  },
  {
    name: "gpu_1x_a10",
    display: "1x A10 (24 GB)",
    gpu_model: "NVIDIA A10",
    gpu_count: 1,
    gpu_vram_gb: 24,
    cpu: "AMD EPYC Milan",
    cpu_cores: 30,
    ram_gb: 200,
    storage_gb: 512,
    storage_type: "NVMe",
    price_hourly: 0.60,
  },
  {
    name: "gpu_8x_h200_sxm",
    display: "8x H200 SXM (141 GB)",
    gpu_model: "NVIDIA H200 SXM",
    gpu_count: 8,
    gpu_vram_gb: 141,
    cpu: "Intel Xeon Platinum",
    cpu_cores: 208,
    ram_gb: 1800,
    storage_gb: 4096,
    storage_type: "NVMe",
    price_hourly: 27.60,
  },
  // AMD Instinct
  {
    name: "gpu_1x_mi300x",
    display: "1x AMD Instinct MI300X (192 GB)",
    gpu_model: "AMD Instinct MI300X",
    gpu_count: 1,
    gpu_vram_gb: 192,
    cpu: "AMD EPYC",
    cpu_cores: 24,
    ram_gb: 384,
    storage_gb: 512,
    storage_type: "NVMe",
    price_hourly: 3.49,
  },
  {
    name: "gpu_8x_mi300x",
    display: "8x AMD Instinct MI300X (192 GB)",
    gpu_model: "AMD Instinct MI300X",
    gpu_count: 8,
    gpu_vram_gb: 192,
    cpu: "AMD EPYC",
    cpu_cores: 192,
    ram_gb: 3072,
    storage_gb: 4096,
    storage_type: "NVMe",
    price_hourly: 27.92,
  },
];

export async function scrapeLambda(): Promise<ScraperResult> {
  const start = Date.now();
  const result: ScraperResult = {
    provider_id: "lambda",
    servers_found: LAMBDA_INSTANCES.length,
    servers_updated: 0,
    errors: [],
    duration_ms: 0,
  };

  // Try to fetch live pricing from Lambda's API
  let livePricing: Record<string, number> = {};
  try {
    const res = await fetch("https://cloud.lambdalabs.com/api/v1/instance-types", {
      headers: { "User-Agent": "GPUHunt/1.0 (server comparison tool)" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        for (const [key, val] of Object.entries(data.data)) {
          const instance = val as { instance_type?: { price_cents_per_hour?: number } };
          if (instance.instance_type?.price_cents_per_hour) {
            livePricing[key] = instance.instance_type.price_cents_per_hour / 100;
          }
        }
      }
    }
  } catch {
    result.errors.push("Could not fetch live Lambda pricing, using known prices");
  }

  for (const instance of LAMBDA_INSTANCES) {
    try {
      const priceHourly = livePricing[instance.name] || instance.price_hourly;
      const priceMonthly = priceHourly * 730; // ~730 hours per month

      const serverId = `lambda-${instance.name}`;

      upsertServer({
        id: serverId,
        provider_id: "lambda",
        name: instance.display,
        cpu: instance.cpu,
        cpu_cores: instance.cpu_cores,
        cpu_threads: null,
        ram_gb: instance.ram_gb,
        storage_type: instance.storage_type,
        storage_gb: instance.storage_gb,
        gpu_model: instance.gpu_model,
        gpu_count: instance.gpu_count,
        gpu_vram_gb: instance.gpu_vram_gb,
        bandwidth_tb: null,
        price_monthly: Math.round(priceMonthly * 100) / 100,
        price_hourly: priceHourly,
        currency: "USD",
        location: "US",
        available: 1,
        url: "https://lambdalabs.com/service/gpu-cloud",
        raw_data: JSON.stringify(instance),
        scraped_at: new Date().toISOString(),
      });

      recordPriceHistory(serverId, priceMonthly, priceHourly, 1);
      result.servers_updated++;
    } catch (err) {
      result.errors.push(`Failed to process ${instance.name}: ${err}`);
    }
  }

  result.duration_ms = Date.now() - start;
  return result;
}
