import { getServersByGpu, getGpuModels } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ model: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { model } = await params;
  const gpuModel = decodeURIComponent(model);
  return {
    title: `${gpuModel} Server Pricing & Availability — GPUHunt`,
    description: `Compare ${gpuModel} GPU server pricing across providers. Find the cheapest ${gpuModel} servers available now.`,
  };
}

export async function generateStaticParams() {
  const gpuModels = getGpuModels();
  return gpuModels.map((g) => ({ model: encodeURIComponent(g.gpu_model) }));
}

export default async function GpuModelPage({ params }: PageProps) {
  const { model } = await params;
  const gpuModel = decodeURIComponent(model);
  const servers = getServersByGpu(gpuModel);

  if (servers.length === 0) notFound();

  const withPrice = servers.filter((s) => s.price_monthly != null);
  const cheapest = withPrice[0];
  const mostExpensive = withPrice[withPrice.length - 1];
  const providerNames = [...new Set(servers.map((s) => s.provider_name))];
  const maxVram = Math.max(...servers.map((s) => s.gpu_vram_gb ?? 0));
  const maxGpuCount = Math.max(...servers.map((s) => s.gpu_count ?? 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <a href="/servers?min_gpu_count=1" className="hover:text-white transition-colors">GPU Servers</a>
        <span>/</span>
        <span style={{ color: "var(--accent)" }}>{gpuModel}</span>
      </div>

      {/* GPU header card */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--accent)" }}
            >
              GPU
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{gpuModel}</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Available from {providerNames.join(", ")}
            </p>
          </div>

          {/* Stats grid */}
          <div className="flex flex-wrap gap-6 sm:gap-8 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">{servers.length}</div>
              <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Listings
              </div>
            </div>
            {cheapest?.price_monthly != null && (
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {cheapest.currency === "EUR" ? "€" : "$"}{cheapest.price_monthly.toFixed(0)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Cheapest /mo
                </div>
              </div>
            )}
            {mostExpensive?.price_monthly != null &&
              mostExpensive.price_monthly !== cheapest?.price_monthly && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {mostExpensive.currency === "EUR" ? "€" : "$"}{mostExpensive.price_monthly.toFixed(0)}
                  </div>
                  <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Most /mo
                  </div>
                </div>
              )}
            {maxVram > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{maxVram} GB</div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Max VRAM
                </div>
              </div>
            )}
            {maxGpuCount > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">up to {maxGpuCount}×</div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  GPUs/server
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ServerTable servers={servers} />
    </div>
  );
}
