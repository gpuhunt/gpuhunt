import { upsertServer } from "../db";
import { ScraperResult } from "../types";

const VULTR_PLANS_API = "https://api.vultr.com/v2/plans-metal?per_page=500";

interface VultrMetalPlan {
  id: string;
  cpu_count: number;
  cpu_cores: number;
  cpu_threads: number;
  cpu_model: string;
  ram: number;           // MB
  disk: number;          // GB per disk
  disk_count: number;
  bandwidth: number;     // GB
  monthly_cost: number;
  hourly_cost: number;
  type: string;          // SSD / NVMe
  locations: string[];
  gpu_brand?: string;    // "none" | "NVIDIA" etc
  gpu_model?: string;
  gpu_vram_gb?: number;
  gpu_count?: number;
}

interface VultrResponse {
  plans_metal: VultrMetalPlan[];
}

function normalizeGpuModel(brand: string | undefined, model: string | undefined, planId?: string): string | null {
  // Also check plan ID for AMD GPU servers where brand/model fields may be empty
  const combined = `${brand ?? ""} ${model ?? ""} ${planId ?? ""}`.toUpperCase();
  if (!brand || brand === "none") {
    // AMD GPU servers identified from plan name
    if (combined.includes("MI355X")) return "AMD Instinct MI355X";
    if (combined.includes("MI325X")) return "AMD Instinct MI325X";
    if (combined.includes("MI300X")) return "AMD Instinct MI300X";
    if (combined.includes("MI300")) return "AMD Instinct MI300";
    if (combined.includes("MI250")) return "AMD Instinct MI250X";
    return null;
  }
  if (brand.toUpperCase() === "AMD") {
    if (combined.includes("MI355X")) return "AMD Instinct MI355X";
    if (combined.includes("MI325X")) return "AMD Instinct MI325X";
    if (combined.includes("MI300X")) return "AMD Instinct MI300X";
    if (combined.includes("MI300")) return "AMD Instinct MI300";
    if (combined.includes("MI250")) return "AMD Instinct MI250X";
    if (combined.includes("MI100")) return "AMD Instinct MI100";
    return `AMD ${model ?? "GPU"}`.trim();
  }
  if (!model) return brand === "NVIDIA" ? "NVIDIA GPU" : null;
  const m = model.toUpperCase();
  if (m.includes("A100")) return "NVIDIA A100";
  if (m.includes("A16"))  return "NVIDIA A16";
  if (m.includes("A40"))  return "NVIDIA A40";
  if (m.includes("L40S")) return "NVIDIA L40S";
  if (m.includes("L40"))  return "NVIDIA L40";
  if (m.includes("H100")) return "NVIDIA H100";
  if (m.includes("H200")) return "NVIDIA H200";
  return `${brand} ${model}`.trim();
}

export async function scrapeVultr(): Promise<ScraperResult> {
  const result: ScraperResult = {
    provider_id: "vultr",
    servers_found: 0,
    servers_updated: 0,
    errors: [],
    duration_ms: 0,
  };

  const start = Date.now();

  try {
    const res = await fetch(VULTR_PLANS_API, {
      headers: { "User-Agent": "gpu-hunt.com server aggregator (support@gpu-hunt.com)" },
    });

    if (!res.ok) throw new Error(`Vultr API returned ${res.status}`);

    const data: VultrResponse = await res.json();
    const plans = data.plans_metal ?? [];
    result.servers_found = plans.length;

    for (const plan of plans) {
      try {
        const gpuModel = normalizeGpuModel(plan.gpu_brand, plan.gpu_model, plan.id);
        const location = plan.locations?.length === 1
          ? plan.locations[0].toUpperCase()
          : plan.locations?.length > 1 ? "Multiple regions" : null;

        upsertServer({
          id: `vultr-${plan.id}`,
          provider_id: "vultr",
          name: plan.id,
          cpu: plan.cpu_model ? `${plan.cpu_model}` : null,
          cpu_cores: plan.cpu_cores || plan.cpu_count || null,
          cpu_threads: plan.cpu_threads || null,
          ram_gb: plan.ram ? Math.round(plan.ram / 1024) : null,
          storage_type: plan.type === "NVMe" ? "NVMe" : "SSD",
          storage_gb: plan.disk * (plan.disk_count || 1),
          gpu_model: gpuModel,
          gpu_count: gpuModel ? (plan.gpu_count || 1) : 0,
          gpu_vram_gb: plan.gpu_vram_gb ?? null,
          bandwidth_tb: plan.bandwidth ? plan.bandwidth / 1000 : null,
          price_monthly: plan.monthly_cost || null,
          price_hourly: plan.hourly_cost || null,
          currency: "USD",
          location,
          available: 1,
          url: "https://www.vultr.com/products/bare-metal/?ref=gpuhunt",
          raw_data: JSON.stringify(plan),
          scraped_at: new Date().toISOString(),
        });

        result.servers_updated++;
      } catch (err) {
        result.errors.push(`Failed to parse Vultr plan ${plan.id}: ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`Vultr scraper failed: ${err}`);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
