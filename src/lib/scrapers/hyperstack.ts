import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

// Hyperstack GPU cloud pricing — https://www.hyperstack.cloud/gpu-pricing
// REST API: https://infrahub-api.nexgencloud.com/v1
// On-demand rates as of 2026-Q1

const FALLBACK_INSTANCES = [
  // H100 NVL
  { gpu: "NVIDIA H100 NVL", vram: 94,  count: 1, price_hr: 2.49,  cpu_cores: 20,  ram: 200,  location: "US"  },
  { gpu: "NVIDIA H100 NVL", vram: 94,  count: 4, price_hr: 9.96,  cpu_cores: 80,  ram: 800,  location: "US"  },
  { gpu: "NVIDIA H100 NVL", vram: 94,  count: 8, price_hr: 19.92, cpu_cores: 160, ram: 1600, location: "EU"  },
  // H100 SXM5
  { gpu: "NVIDIA H100 SXM5", vram: 80, count: 8, price_hr: 23.92, cpu_cores: 160, ram: 1600, location: "US"  },
  // H200
  { gpu: "NVIDIA H200 SXM", vram: 141, count: 8, price_hr: 36.00, cpu_cores: 192, ram: 1600, location: "US"  },
  // A100
  { gpu: "NVIDIA A100 SXM4", vram: 80, count: 1, price_hr: 1.99,  cpu_cores: 20,  ram: 180,  location: "US"  },
  { gpu: "NVIDIA A100 SXM4", vram: 80, count: 8, price_hr: 15.92, cpu_cores: 160, ram: 1440, location: "US"  },
  { gpu: "NVIDIA A100 PCIe", vram: 80, count: 1, price_hr: 1.79,  cpu_cores: 16,  ram: 120,  location: "EU"  },
  { gpu: "NVIDIA A100 PCIe", vram: 80, count: 4, price_hr: 7.16,  cpu_cores: 64,  ram: 480,  location: "EU"  },
  // L40
  { gpu: "NVIDIA L40",      vram: 48,  count: 1, price_hr: 1.29,  cpu_cores: 12,  ram: 96,   location: "US"  },
  { gpu: "NVIDIA L40",      vram: 48,  count: 4, price_hr: 5.16,  cpu_cores: 48,  ram: 384,  location: "US"  },
  // L40S
  { gpu: "NVIDIA L40S",     vram: 48,  count: 1, price_hr: 1.49,  cpu_cores: 16,  ram: 120,  location: "US"  },
  { gpu: "NVIDIA L40S",     vram: 48,  count: 8, price_hr: 11.92, cpu_cores: 128, ram: 960,  location: "US"  },
  // A40
  { gpu: "NVIDIA A40",      vram: 48,  count: 1, price_hr: 0.85,  cpu_cores: 10,  ram: 80,   location: "EU"  },
  { gpu: "NVIDIA A40",      vram: 48,  count: 4, price_hr: 3.40,  cpu_cores: 40,  ram: 320,  location: "EU"  },
];

interface HyperstackFlavor {
  id: string;
  name: string;
  gpu: { name: string; count: number; vram: string } | null;
  vcpus: number;
  ram: number;
  pricing?: { price_per_hour: number };
  region_name?: string;
}

export async function scrapeHyperstack(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];
  let found = 0, updated = 0;
  const now = new Date().toISOString();

  let instances = FALLBACK_INSTANCES;

  try {
    const res = await fetch("https://infrahub-api.nexgencloud.com/v1/core/flavors", {
      headers: {
        "User-Agent": "GPUHunt/1.0 (gpu-hunt.com)",
        "Accept": "application/json",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const flavors: HyperstackFlavor[] = data?.flavors ?? data?.data ?? [];
      const liveInstances: typeof FALLBACK_INSTANCES = [];

      for (const f of flavors) {
        if (!f.gpu || !f.pricing?.price_per_hour) continue;
        const vramMatch = f.gpu.vram?.match(/(\d+)/);
        const vram = vramMatch ? parseInt(vramMatch[1]) : 80;
        liveInstances.push({
          gpu: `NVIDIA ${f.gpu.name}`,
          vram,
          count: f.gpu.count,
          price_hr: f.pricing.price_per_hour,
          cpu_cores: f.vcpus,
          ram: Math.round(f.ram / 1024),
          location: f.region_name?.startsWith("EU") ? "EU" : "US",
        });
      }

      if (liveInstances.length > 0) instances = liveInstances;
    }
  } catch {
    errors.push("Hyperstack API unavailable, using fallback pricing");
  }

  for (const inst of instances) {
    const idKey = `${inst.gpu}-${inst.count}x-${inst.vram}gb-${inst.location}`
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const serverId = `hyperstack-${idKey}`;
    const monthly = Math.round(inst.price_hr * 730 * 100) / 100;

    try {
      upsertServer({
        id: serverId,
        provider_id: "hyperstack",
        name: `${inst.count}× ${inst.gpu.replace("NVIDIA ", "")} ${inst.vram}GB`,
        cpu: null, cpu_cores: inst.cpu_cores, cpu_threads: null,
        ram_gb: inst.ram, storage_type: "NVMe", storage_gb: null,
        gpu_model: inst.gpu, gpu_count: inst.count, gpu_vram_gb: inst.vram,
        bandwidth_tb: null, price_monthly: monthly, price_hourly: inst.price_hr,
        currency: "USD", location: inst.location, available: 1,
        url: "https://www.hyperstack.cloud/gpu-pricing",
        raw_data: null, scraped_at: now,
      });
      recordPriceHistory(serverId, monthly, inst.price_hr, 1);
      found++; updated++;
    } catch (e) {
      errors.push(`Hyperstack upsert failed for ${idKey}: ${e}`);
    }
  }

  return { provider_id: "hyperstack", servers_found: found, servers_updated: updated, errors, duration_ms: Date.now() - start };
}
