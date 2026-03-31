import { upsertServer, recordPriceHistory } from "../db";
import { ScraperResult } from "../types";

interface HetznerServer {
  id: number;
  name: string;
  description: string[];
  cpu: string;
  cpu_count: number;
  cpu_benchmark?: number;
  is_highio: boolean;
  datacenter: string;
  traffic: string;
  bandwidth: number;
  price: number;
  hourly_price: number | null;
  ram_size: number;
  ram: string[];
  hdd_size: number;
  hdd_count: number;
  hdd_arr: string[];
  serverDiskData: {
    nvme: number[];
    sata: number[];
    hdd: number[];
  };
  is_ecc: boolean;
  specials: string[];
}

export async function scrapeHetzner(): Promise<ScraperResult> {
  const start = Date.now();
  const result: ScraperResult = {
    provider_id: "hetzner",
    servers_found: 0,
    servers_updated: 0,
    errors: [],
    duration_ms: 0,
  };

  try {
    const res = await fetch(
      "https://www.hetzner.com/_resources/app/data/app/live_data_sb_EUR.json",
      { headers: { "User-Agent": "GPUHunt/1.0 (server comparison tool)" } }
    );

    if (!res.ok) {
      result.errors.push(`Hetzner API returned ${res.status}`);
      result.duration_ms = Date.now() - start;
      return result;
    }

    const data = await res.json();
    const servers: HetznerServer[] = data.server || [];
    result.servers_found = servers.length;

    for (const s of servers) {
      try {
        const priceMonthly = s.price;

        // Determine storage type
        let storageType = "HDD";
        if (s.serverDiskData?.nvme?.length > 0) storageType = "NVMe";
        else if (s.serverDiskData?.sata?.length > 0) storageType = "SSD";
        else if (s.hdd_arr?.some((d) => d.includes("NVMe"))) storageType = "NVMe";
        else if (s.hdd_arr?.some((d) => d.includes("SSD"))) storageType = "SSD";

        // Extract GPU info from description array
        const gpuInfo = extractGpuFromDescription(s.description || []);

        const serverId = `hetzner-${s.id}`;

        upsertServer({
          id: serverId,
          provider_id: "hetzner",
          name: s.cpu || s.name,
          cpu: s.cpu,
          cpu_cores: s.cpu_count || null,
          cpu_threads: null,
          ram_gb: s.ram_size,
          storage_type: storageType,
          storage_gb: s.hdd_size,
          gpu_model: gpuInfo.model,
          gpu_count: gpuInfo.count,
          gpu_vram_gb: gpuInfo.vram,
          bandwidth_tb: s.traffic === "unlimited" ? null : parseFloat(s.traffic) || null,
          price_monthly: priceMonthly,
          price_hourly: s.hourly_price,
          currency: "EUR",
          location: s.datacenter,
          available: 1,
          url: `https://www.hetzner.com/sb?search=${s.id}`,
          raw_data: JSON.stringify(s),
          scraped_at: new Date().toISOString(),
        });

        recordPriceHistory(serverId, priceMonthly, s.hourly_price, 1);
        result.servers_updated++;
      } catch (err) {
        result.errors.push(`Failed to process server ${s.id}: ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`Hetzner scrape failed: ${err}`);
  }

  result.duration_ms = Date.now() - start;
  return result;
}

function extractGpuFromDescription(descriptions: string[]): {
  model: string | null;
  count: number;
  vram: number | null;
} {
  for (const d of descriptions) {
    const upper = d.toUpperCase();
    if (
      upper.includes("GPU") || upper.includes("NVIDIA") || upper.includes("RTX") ||
      upper.includes("A100") || upper.includes("H100") || upper.includes("TESLA") ||
      upper.includes("QUADRO") || upper.includes("A40") || upper.includes("L40") ||
      upper.includes("GEFORCE")
    ) {
      const countMatch = d.match(/(\d+)\s*x\s*/i);
      const count = countMatch ? parseInt(countMatch[1]) : 1;
      const vramMatch = d.match(/(\d+)\s*GB/i);
      const vram = vramMatch ? parseInt(vramMatch[1]) : null;
      const model = d.replace(/^GPU:\s*/i, "").replace(/^\d+\s*x\s*/i, "").trim();
      return { model, count, vram };
    }
  }
  return { model: null, count: 0, vram: null };
}
