import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

const OVH_CATALOG_API =
  "https://api.us.ovhcloud.com/v1/order/catalog/public/baremetalServers?ovhSubsidiary=US";

interface OvhAddonFamily {
  name: string;
  addons: string[];
  default?: string;
}

interface OvhPricing {
  price: number;
  formattedPrice: string;
  intervalUnit: string;
  capacities: string[];
}

interface OvhPlan {
  planCode: string;
  invoiceName: string;
  product: string;
  addonFamilies: OvhAddonFamily[];
  pricings: OvhPricing[];
  blobs?: Record<string, unknown>;
}

export async function scrapeOvh(): Promise<ScraperResult> {
  const start = Date.now();
  const result: ScraperResult = {
    provider_id: "ovh",
    servers_found: 0,
    servers_updated: 0,
    errors: [],
    duration_ms: 0,
  };

  try {
    const res = await fetch(OVH_CATALOG_API, {
      headers: { "User-Agent": "GPUHunt/1.0 (server comparison tool)" },
    });

    if (!res.ok) {
      result.errors.push(`OVH catalog API returned ${res.status}`);
      result.duration_ms = Date.now() - start;
      return result;
    }

    const data = await res.json();
    const plans: OvhPlan[] = data.plans || [];
    result.servers_found = plans.length;

    for (const plan of plans) {
      try {
        // Find monthly renewal price
        const monthlyPricing = plan.pricings.find(
          (p) => p.intervalUnit === "month" && p.capacities.includes("renew")
        );
        if (!monthlyPricing) continue;

        // OVH prices are in 10^-8 units (microcents)
        const priceMonthly = monthlyPricing.price / 100000000;
        if (priceMonthly <= 0) continue;

        // Parse specs from addon family names
        const ramGb = parseRamFromAddons(plan.addonFamilies);
        const storage = parseStorageFromAddons(plan.addonFamilies);
        const gpu = parseGpuFromAddons(plan.addonFamilies);

        const serverId = `ovh-${plan.planCode}`;

        upsertServer({
          id: serverId,
          provider_id: "ovh",
          name: plan.invoiceName || plan.planCode,
          cpu: null, // CPU info not readily available in catalog
          cpu_cores: null,
          cpu_threads: null,
          ram_gb: ramGb,
          storage_type: storage.type,
          storage_gb: storage.gb,
          gpu_model: gpu.model,
          gpu_count: gpu.count,
          gpu_vram_gb: gpu.vram,
          bandwidth_tb: null,
          price_monthly: Math.round(priceMonthly * 100) / 100,
          price_hourly: null,
          currency: "USD",
          location: "US",
          available: 1,
          url: "https://us.ovhcloud.com/bare-metal/prices/",
          raw_data: JSON.stringify(plan),
          scraped_at: new Date().toISOString(),
        });

        recordPriceHistory(serverId, priceMonthly, null, 1);
        result.servers_updated++;
      } catch (err) {
        result.errors.push(`Failed to process plan ${plan.planCode}: ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`OVH scrape failed: ${err}`);
  }

  result.duration_ms = Date.now() - start;
  return result;
}

function parseRamFromAddons(families: OvhAddonFamily[]): number | null {
  const memFamily = families.find((f) => f.name === "memory");
  if (!memFamily?.default) return null;
  // Parse from addon name like "ram-192g-ecc-4800-..."
  const match = memFamily.default.match(/ram-(\d+)g/i);
  return match ? parseInt(match[1]) : null;
}

function parseStorageFromAddons(families: OvhAddonFamily[]): {
  type: string | null;
  gb: number | null;
} {
  const storFamily = families.find((f) => f.name === "storage");
  if (!storFamily?.default) return { type: null, gb: null };
  // Parse from addon name like "softraid-2x960nvme-..." or "softraid-2x4000sa-..."
  const name = storFamily.default;
  const match = name.match(/(\d+)x(\d+)(nvme|sa|ssd)/i);
  if (match) {
    const count = parseInt(match[1]);
    const sizeGb = parseInt(match[2]);
    const tech = match[3].toLowerCase();
    const type = tech === "nvme" ? "NVMe" : tech === "ssd" ? "SSD" : "HDD";
    return { type, gb: count * sizeGb };
  }
  return { type: null, gb: null };
}

function parseGpuFromAddons(families: OvhAddonFamily[]): {
  model: string | null;
  count: number;
  vram: number | null;
} {
  const gpuFamily = families.find((f) => f.name === "gpu");
  if (!gpuFamily || gpuFamily.addons.length === 0) {
    return { model: null, count: 0, vram: null };
  }
  // Parse from addon name like "gpu-4xnvidia-l4-..."
  const defaultAddon = gpuFamily.default || gpuFamily.addons[0];
  const match = defaultAddon.match(/gpu-(\d+)x(nvidia-[\w-]+)/i);
  if (match) {
    const count = parseInt(match[1]);
    const rawModel = match[2].replace(/-/g, " ").trim().toUpperCase();

    // Normalize to canonical name
    let model: string | null = null;
    let vram: number | null = null;

    if (rawModel.includes("H200"))      { model = "NVIDIA H200"; vram = 141; }
    else if (rawModel.includes("H100")) { model = "NVIDIA H100"; vram = 80;  }
    else if (rawModel.includes("A100")) { model = "NVIDIA A100"; vram = 80;  }
    else if (rawModel.includes("L40S")) { model = "NVIDIA L40S"; vram = 48;  }
    else if (rawModel.includes("L40"))  { model = "NVIDIA L40";  vram = 48;  }
    else if (rawModel.includes("L4"))   { model = "NVIDIA L4";   vram = 24;  }
    else if (rawModel.includes("A40"))  { model = "NVIDIA A40";  vram = 48;  }
    else if (rawModel.includes("A10G")) { model = "NVIDIA A10G"; vram = 24;  }
    else if (rawModel.includes("A10"))  { model = "NVIDIA A10";  vram = 24;  }
    else {
      // Fallback: title-case the raw model
      model = "NVIDIA " + rawModel.replace("NVIDIA ", "").split(" ").map(
        (w: string) => w.charAt(0) + w.slice(1).toLowerCase()
      ).join(" ");
    }

    return { model, count, vram };
  }
  return { model: null, count: 0, vram: null };
}
