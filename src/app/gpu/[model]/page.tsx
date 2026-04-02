import { getServersByGpu, getGpuModels, getGpuPriceHistory } from "@/lib/db";
import { getGpuSpec } from "@/lib/gpu-specs";
import ServerTable from "@/components/ServerTable";
import PriceSparkline from "@/components/PriceSparkline";
import PriceAlertBanner from "@/components/PriceAlertBanner";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ model: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { model } = await params;
  const gpuModel = decodeURIComponent(model);
  const shortName = gpuModel.replace("NVIDIA ", "").replace("AMD Instinct ", "");
  const servers = getServersByGpu(gpuModel);
  const providerCount = new Set(servers.map((s) => s.provider_name)).size;
  return {
    title: `${gpuModel} Rental Pricing — Compare ${shortName} Servers`,
    description: `Compare ${gpuModel} GPU server pricing across ${providerCount}+ cloud providers. Find the cheapest ${shortName} instance available right now.`,
    openGraph: {
      title: `${gpuModel} GPU Rental Prices`,
      description: `Live pricing for ${gpuModel} GPU servers across all major cloud providers. Starting from $${servers.filter((s) => s.price_hourly != null).sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0]?.price_hourly?.toFixed(2) ?? "—"}/hr.`,
    },
  };
}

export async function generateStaticParams() {
  const gpuModels = getGpuModels();
  return gpuModels.map((g) => ({ model: g.gpu_model }));
}

export default async function GpuModelPage({ params }: PageProps) {
  const { model } = await params;
  const gpuModel = decodeURIComponent(model);
  const servers = getServersByGpu(gpuModel);

  if (servers.length === 0) notFound();

  const withPrice = servers.filter((s) => s.price_monthly != null);
  const withHourly = servers.filter((s) => s.price_hourly != null);
  const cheapest = withHourly.sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0];
  const mostExpensive = withPrice[withPrice.length - 1];
  const providerNames = [...new Set(servers.map((s) => s.provider_name))];
  const maxVram = Math.max(...servers.map((s) => s.gpu_vram_gb ?? 0));
  const maxGpuCount = Math.max(...servers.map((s) => s.gpu_count ?? 0));

  const priceHistory = getGpuPriceHistory(gpuModel, 30);
  const spec = getGpuSpec(gpuModel);

  const shortName = gpuModel.replace("NVIDIA ", "").replace("AMD Instinct ", "");

  // Save % vs average
  const avgHourly = withHourly.length > 1
    ? withHourly.reduce((sum, s) => sum + (s.price_hourly ?? 0), 0) / withHourly.length
    : null;
  const savePct = avgHourly && cheapest?.price_hourly
    ? Math.round((1 - cheapest.price_hourly / avgHourly) * 100)
    : null;

  const sortedHourly = [...withHourly].sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0));
  const highestHourly = withHourly.reduce((max, s) => (s.price_hourly ?? 0) > (max?.price_hourly ?? 0) ? s : max, withHourly[0]);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${gpuModel} GPU Server`,
    description: `Rent a ${gpuModel} GPU server from ${providerNames.slice(0, 3).join(", ")} and more. Starting from $${cheapest?.price_hourly?.toFixed(2) ?? "—"}/hr.`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: cheapest?.price_hourly?.toFixed(4),
      highPrice: highestHourly?.price_hourly?.toFixed(4),
      priceCurrency: "USD",
      offerCount: withHourly.length,
      offers: sortedHourly.slice(0, 5).map((s) => ({
        "@type": "Offer",
        url: s.url,
        price: s.price_hourly?.toFixed(4),
        priceCurrency: s.currency,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: s.provider_name },
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "GPUHunt", item: "https://gpu-hunt.com" },
      { "@type": "ListItem", position: 2, name: "GPU Servers", item: "https://gpu-hunt.com/servers?min_gpu_count=1" },
      { "@type": "ListItem", position: 3, name: gpuModel, item: `https://gpu-hunt.com/gpu/${encodeURIComponent(gpuModel)}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <a href="/servers?min_gpu_count=1" className="hover:text-white transition-colors">GPU Servers</a>
        <span>/</span>
        <span style={{ color: "var(--accent)" }}>{gpuModel}</span>
      </div>

      {/* GPU header */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
              GPU
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{gpuModel}</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Available from {providerNames.join(", ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 sm:gap-8 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">{servers.length}</div>
              <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Listings</div>
            </div>
            {cheapest?.price_hourly != null && (
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  ${cheapest.price_hourly.toFixed(2)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>From /hr</div>
                {savePct != null && savePct >= 10 && (
                  <div className="text-xs mt-1 font-semibold" style={{ color: "var(--green)" }}>
                    Save {savePct}% vs avg
                  </div>
                )}
              </div>
            )}
            {avgHourly != null && withHourly.length > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  ${avgHourly.toFixed(2)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Avg /hr</div>
              </div>
            )}
            {cheapest?.price_monthly != null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">
                  {cheapest.currency === "EUR" ? "€" : "$"}{cheapest.price_monthly.toFixed(0)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>From /mo</div>
              </div>
            )}
            {maxVram > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{maxVram} GB</div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>VRAM</div>
              </div>
            )}
            {maxGpuCount > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">up to {maxGpuCount}×</div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPUs/server</div>
              </div>
            )}
          </div>
        </div>

        {/* Price history sparkline */}
        {priceHistory.length > 0 && (
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Price trend (30 days)
            </div>
            <PriceSparkline data={priceHistory} width={200} height={48} />
          </div>
        )}
      </div>

      {/* GPU spec card */}
      {spec && (
        <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Specifications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Architecture</div>
              <div className="text-sm font-semibold text-white">{spec.architecture}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>VRAM</div>
              <div className="text-sm font-semibold text-white">{spec.vram_gb} GB {spec.vram_type}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Memory BW</div>
              <div className="text-sm font-semibold text-white">{spec.vram_bandwidth_tbs} TB/s</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>FP16 TFLOPs</div>
              <div className="text-sm font-semibold text-white">{spec.fp16_tflops.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>TDP</div>
              <div className="text-sm font-semibold text-white">{spec.tdp_w} W</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>NVLink</div>
              <div className="text-sm font-semibold" style={{ color: spec.nvlink ? "var(--green)" : "var(--text-muted)" }}>
                {spec.nvlink ? "Yes" : "No"}
              </div>
            </div>
          </div>
          {spec.notes && (
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
              {spec.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {spec.use_cases.map((uc) => {
              const ucSlug = uc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
              const knownSlugs: Record<string, string> = {
                "llm-training": "llm-training",
                "inference": "inference",
                "fine-tuning": "fine-tuning",
                "qlora-": "fine-tuning",
                "image-generation": "image-generation",
                "embeddings": "embedding",
              };
              const linkSlug = Object.entries(knownSlugs).find(([k]) => ucSlug.includes(k))?.[1];
              return linkSlug ? (
                <a key={uc} href={`/use-case/${linkSlug}`}>
                  <span className="badge badge-cyan" style={{ fontSize: "11px" }}>{uc}</span>
                </a>
              ) : (
                <span key={uc} className="badge badge-muted" style={{ fontSize: "11px" }}>{uc}</span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6">
        <PriceAlertBanner gpuModel={gpuModel} />
      </div>

      <ServerTable servers={servers} />

      {/* Cross-links */}
      <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>COMPARE PROVIDERS</h3>
        <div className="flex flex-wrap gap-2">
          {providerNames.map((name) => {
            const slug = servers.find((s) => s.provider_name === name)?.provider_slug;
            return slug ? (
              <a key={slug} href={`/provider/${slug}`} className="badge badge-muted text-xs">
                {name} →
              </a>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
