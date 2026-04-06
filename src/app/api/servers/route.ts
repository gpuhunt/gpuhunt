import { NextRequest, NextResponse } from "next/server";
import { getServers, getServerCount } from "@/lib/db";
import { ServerFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: ServerFilters = {
    gpu_model: searchParams.get("gpu_model") || undefined,
    provider: searchParams.get("provider") || undefined,
    min_price: searchParams.has("min_price")
      ? parseFloat(searchParams.get("min_price")!)
      : undefined,
    max_price: searchParams.has("max_price")
      ? parseFloat(searchParams.get("max_price")!)
      : undefined,
    min_ram: searchParams.has("min_ram")
      ? parseInt(searchParams.get("min_ram")!)
      : undefined,
    min_gpu_vram: searchParams.has("min_gpu_vram")
      ? parseInt(searchParams.get("min_gpu_vram")!)
      : undefined,
    min_gpu_count: searchParams.has("min_gpu_count")
      ? parseInt(searchParams.get("min_gpu_count")!)
      : undefined,
    available_only: searchParams.get("available_only") !== "false",
    sort_by:
      (searchParams.get("sort_by") as ServerFilters["sort_by"]) || "price_monthly",
    sort_order: (searchParams.get("sort_order") as "asc" | "desc") || "asc",
    search: searchParams.get("search") || undefined,
    limit: Math.min(parseInt(searchParams.get("limit") || "100"), 500),
    offset: parseInt(searchParams.get("offset") || "0"),
    deduplicate: searchParams.get("deduplicate") === "true",
  };

  const servers = getServers(filters);
  const total = getServerCount(filters);

  return NextResponse.json({
    data: servers,
    meta: {
      total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
}
