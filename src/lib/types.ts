export interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string;
  affiliate_url: string | null;
  logo_url: string | null;
  description: string | null;
  credits_usd: number | null;
  updated_at: string;
}

export interface Server {
  id: string;
  provider_id: string;
  name: string;
  cpu: string | null;
  cpu_cores: number | null;
  cpu_threads: number | null;
  ram_gb: number | null;
  storage_type: string | null;
  storage_gb: number | null;
  gpu_model: string | null;
  gpu_count: number;
  gpu_vram_gb: number | null;
  bandwidth_tb: number | null;
  price_monthly: number | null;
  price_hourly: number | null;
  currency: string;
  location: string | null;
  available: number;
  url: string;
  raw_data: string | null;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface ServerWithProvider extends Server {
  provider_name: string;
  provider_slug: string;
  provider_website: string;
}

export interface ServerFilters {
  gpu_model?: string;
  provider?: string;
  exclude_providers?: string[];
  min_price?: number;
  max_price?: number;
  min_ram?: number;
  min_gpu_vram?: number;
  min_gpu_count?: number;
  available_only?: boolean;
  sort_by?: "price_monthly" | "gpu_count" | "ram_gb" | "gpu_vram_gb";
  sort_order?: "asc" | "desc";
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ScraperResult {
  provider_id: string;
  servers_found: number;
  servers_updated: number;
  errors: string[];
  duration_ms: number;
}
