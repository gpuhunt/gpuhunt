import { Suspense } from "react";
import { getServers, getGpuModels, getProviders, getServerCount } from "@/lib/db";
import { ServerFilters } from "@/lib/types";
import ServerTable from "@/components/ServerTable";
import FilterSidebar from "@/components/FilterSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud GPU Rental Prices — Compare H100, A100, RTX 4090",
  description: "Browse and filter 500+ cloud GPU server configs. Compare H100, A100, MI300X, L40S, and RTX 4090 pricing across Lambda Labs, RunPod, CoreWeave, and 17+ more providers.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ServersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: ServerFilters = {
    gpu_model:     typeof params.gpu_model === "string" ? params.gpu_model : undefined,
    provider:      typeof params.provider  === "string" ? params.provider  : undefined,
    max_price:     params.max_price     ? parseFloat(params.max_price as string) : undefined,
    min_ram:       params.min_ram       ? parseInt(params.min_ram as string)     : undefined,
    min_gpu_count: params.min_gpu_count ? parseInt(params.min_gpu_count as string) : undefined,
    sort_by:       (params.sort_by as ServerFilters["sort_by"]) || "price_monthly",
    sort_order:    (params.sort_order as "asc" | "desc") || "asc",
    available_only: true,
    limit: 200,
  };

  const servers      = getServers(filters);
  const totalCount   = getServerCount(filters);
  const gpuModels    = getGpuModels();
  const providers    = getProviders();
  const activeProvider = filters.provider ? providers.find((p) => p.slug === filters.provider) : null;

  const title = filters.gpu_model
    ? `${filters.gpu_model} Servers`
    : activeProvider
    ? `${activeProvider.name} Servers`
    : "All Servers";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="mb-8" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          <a href="/" className="transition-colors hover:text-white">GPUHunt</a>
          <span>/</span>
          <span style={{ color: "var(--text-secondary)" }}>Servers</span>
          {filters.gpu_model && (
            <><span>/</span><span style={{ color: "var(--accent-light)" }}>{filters.gpu_model}</span></>
          )}
          {activeProvider && (
            <><span>/</span><span style={{ color: "var(--accent-light)" }}>{activeProvider.name}</span></>
          )}
        </div>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>{title}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              <span className="tabular-nums font-semibold" style={{ color: "var(--text-secondary)" }}>
                {totalCount.toLocaleString()}
              </span>{" "}
              server{totalCount !== 1 ? "s" : ""} match your criteria
            </p>
          </div>
          <span className="badge badge-green">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glow-pulse 2s ease-in-out infinite" }} />
            Live
          </span>
        </div>
      </div>

      {/* Budget quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs self-center mr-1" style={{ color: "var(--text-muted)" }}>Budget:</span>
        {[
          { label: "Under $1/hr",  max_price: 730   },
          { label: "Under $3/hr",  max_price: 2190  },
          { label: "Under $10/hr", max_price: 7300  },
          { label: "Under $50/hr", max_price: 36500 },
        ].map(({ label, max_price }) => {
          const isActive = filters.max_price === max_price;
          const href = (() => {
            const p = new URLSearchParams();
            if (filters.gpu_model) p.set("gpu_model", filters.gpu_model);
            if (filters.provider)  p.set("provider",  filters.provider);
            if (filters.min_gpu_count) p.set("min_gpu_count", String(filters.min_gpu_count));
            if (!isActive) p.set("max_price", String(max_price));
            return `/servers?${p.toString()}`;
          })();
          return (
            <a
              key={label}
              href={href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: isActive ? "var(--accent)" : "var(--surface)",
                border: "1px solid",
                borderColor: isActive ? "var(--accent)" : "var(--border)",
                color: isActive ? "#fff" : "var(--text-muted)",
              }}
            >
              {label}
            </a>
          );
        })}
        {/* GPU count quick-filter */}
        <span className="text-xs self-center ml-3 mr-1" style={{ color: "var(--text-muted)" }}>Size:</span>
        {[
          { label: "Single GPU",  min_gpu_count: 1  },
          { label: "2+ GPUs",     min_gpu_count: 2  },
          { label: "4+ GPUs",     min_gpu_count: 4  },
          { label: "8+ GPUs",     min_gpu_count: 8  },
        ].map(({ label, min_gpu_count }) => {
          const isActive = filters.min_gpu_count === min_gpu_count;
          const href = (() => {
            const p = new URLSearchParams();
            if (filters.gpu_model) p.set("gpu_model", filters.gpu_model);
            if (filters.provider)  p.set("provider",  filters.provider);
            if (filters.max_price) p.set("max_price",  String(filters.max_price));
            if (!isActive) p.set("min_gpu_count", String(min_gpu_count));
            return `/servers?${p.toString()}`;
          })();
          return (
            <a
              key={label}
              href={href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: isActive ? "var(--accent)" : "var(--surface)",
                border: "1px solid",
                borderColor: isActive ? "var(--accent)" : "var(--border)",
                color: isActive ? "#fff" : "var(--text-muted)",
              }}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={<div className="w-56 shrink-0" />}>
          <FilterSidebar
            gpuModels={gpuModels}
            providers={providers.map((p) => ({ slug: p.slug, name: p.name }))}
          />
        </Suspense>
        <div className="flex-1 min-w-0">
          <ServerTable servers={servers} />
        </div>
      </div>
    </div>
  );
}
