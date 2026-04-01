import { getProviders, getServerCount, getGpuFamilyCounts, getBestDealsPerFamily, getServers } from "@/lib/db";
import ProviderLogo from "@/components/ProviderLogo";
import GeoDeals from "@/components/GeoDeals";
import QuickSearch from "@/components/QuickSearch";

// Providers that are peer marketplaces / spot-only — excluded from "Best Cloud Deals"
const MARKETPLACE_PROVIDERS = ["vast", "salad"];

function fmt(price: number | null, currency?: string) {
  if (!price) return "—";
  return `${currency === "EUR" ? "€" : "$"}${price.toFixed(0)}`;
}

function fmtHr(price: number | null) {
  if (!price) return null;
  return `$${price.toFixed(2)}/hr`;
}

export default function HomePage() {
  const totalServers = getServerCount({ available_only: true });
  const gpuCount     = getServerCount({ min_gpu_count: 1, available_only: true });
  const providers    = getProviders();
  const gpuFamilies  = getGpuFamilyCounts();

  // Enrich providers with server count + cheapest GPU for the homepage grid
  const providerStats = providers.map((p) => {
    const cheapestGpu = getServers({ provider: p.slug, min_gpu_count: 1, sort_by: "price_hourly", available_only: true, limit: 1 })[0] ?? null;
    const serverCount = getServerCount({ provider: p.slug, available_only: true });
    return { ...p, cheapestGpu, serverCount };
  });

  // Best cloud deals — one per GPU family, diverse providers (no Hetzner bare metal dominating)
  const cloudDeals = getBestDealsPerFamily({
    exclude_providers: MARKETPLACE_PROVIDERS,
    limit: 6,
  });

  // Spot section: cheapest GPU deal from each marketplace provider
  const spotDeals = MARKETPLACE_PROVIDERS.flatMap((slug) =>
    getServers({ provider: slug, min_gpu_count: 1, sort_by: "price_hourly", available_only: true, limit: 1 })
  ).filter(Boolean);

  // Ticker: mix of cloud deals
  const ticker = getServers({
    min_gpu_count: 1,
    sort_by: "price_monthly",
    exclude_providers: MARKETPLACE_PROVIDERS,
    available_only: true,
    limit: 20,
  });

  // Price pills for hero
  const heroPills = [
    { model: "NVIDIA H100",          label: "H100",    color: "var(--green)"  },
    { model: "NVIDIA A100",          label: "A100",    color: "var(--cyan)"   },
    { model: "NVIDIA L40S",          label: "L40S",    color: "var(--accent-light)" },
    { model: "AMD Instinct MI300X",  label: "MI300X",  color: "var(--amber)"  },
    { model: "NVIDIA RTX 4090",      label: "4090",    color: "var(--text-secondary)" },
  ].map((p) => ({
    ...p,
    server: getServers({ gpu_model: p.model, sort_by: "price_hourly", exclude_providers: MARKETPLACE_PROVIDERS, available_only: true, limit: 1 })[0] ?? null,
  })).filter((p) => p.server?.price_hourly);

  return (
    <div>
      {/* ── Live price ticker ── */}
      {ticker.length > 0 && (
        <div
          className="overflow-hidden py-2.5 text-xs select-none"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <div className="ticker-track">
            {[...ticker, ...ticker].map((s, i) => (
              <span key={i} className="flex items-center gap-2 px-5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{s.provider_name}</span>
                <span className="font-medium" style={{ color: "var(--accent-light)" }}>
                  {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                </span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {fmt(s.price_monthly, s.currency)}/mo
                </span>
                <span style={{ color: "var(--border-hover)" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative bg-grid overflow-hidden" style={{ paddingTop: "88px", paddingBottom: "88px" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(99,102,241,0.13) 0%, transparent 70%)",
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }} />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="badge badge-indigo">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glow-pulse 2s ease-in-out infinite" }} />
              Live · {providers.length} providers
            </span>
          </div>

          <h1 className="font-bold leading-none mb-5 tracking-tight"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.8rem)", letterSpacing: "-0.04em" }}>
            <span className="gradient-text">Find the best GPU</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>server deal.</span>
          </h1>

          <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
            {totalServers.toLocaleString()} servers. {gpuCount.toLocaleString()} GPU-ready.
            Compare H100, MI300X, A100, RTX&nbsp;4090 and more across {providers.length} providers — no signup.
          </p>

          {/* Quick search widget */}
          <div className="mb-8">
            <QuickSearch gpuFamilies={gpuFamilies} />
          </div>

          {/* Live price pills */}
          {heroPills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {heroPills.map((p) => (
                <a
                  key={p.model}
                  href={`/gpu/${encodeURIComponent(p.model)}`}
                  className="glass rounded-lg px-3 py-1.5 text-xs transition-opacity hover:opacity-80 tabular-nums"
                >
                  <span style={{ color: "var(--text-muted)" }}>{p.label} </span>
                  <span className="font-bold" style={{ color: p.color }}>
                    from ${p.server!.price_hourly!.toFixed(2)}/hr
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4">
          {[
            { value: totalServers.toLocaleString(), label: "Servers tracked",  sub: "available now"      },
            { value: gpuCount.toLocaleString(),     label: "GPU servers",       sub: "NVIDIA & AMD"       },
            { value: gpuFamilies.length.toString(), label: "GPU families",      sub: "H100 · A100 · more" },
            { value: providers.length.toString(),   label: "Providers",         sub: "global coverage"    },
          ].map((s, i) => (
            <div key={s.label}
              className={`text-center py-7 ${
                i === 0 ? "border-r" :
                i === 1 ? "sm:border-r" :
                i === 2 ? "border-r" : ""
              }`}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-3xl font-bold tabular-nums mb-0.5" style={{ letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by GPU Family ── */}
      {gpuFamilies.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Browse by GPU</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {gpuFamilies.length} GPU models across {providers.length} providers
                </p>
              </div>
              <a href="/servers?min_gpu_count=1" className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>View all →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {gpuFamilies.map((gpu) => (
                <a
                  key={gpu.family}
                  href={`/servers?gpu_model=${encodeURIComponent(gpu.family)}`}
                  className="card-hover block p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                      {gpu.label}
                    </div>
                    <span className={`badge ${gpu.badge} shrink-0`} style={{ fontSize: "9px" }}>
                      {gpu.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {gpu.count} listing{gpu.count !== 1 ? "s" : ""}
                  </div>
                  {gpu.cheapest && (
                    <div className="text-xs mt-1 font-medium tabular-nums" style={{ color: "var(--accent-light)" }}>
                      from ${gpu.cheapest.toFixed(2)}/hr
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Best GPU Deals — geo-personalized client component ── */}
      <GeoDeals fallback={cloudDeals} totalGpuCount={gpuCount} />

      {/* ── Spot & Marketplace Pricing ── */}
      {spotDeals.length > 0 && (
        <section className="py-12 px-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Spot & Marketplace Pricing</h2>
                  <span className="badge badge-amber" style={{ fontSize: "9px" }}>SPOT</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Lowest prices on peer marketplaces — variable availability, great for flexible workloads.
                </p>
              </div>
              <a href="/servers?min_gpu_count=1" className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--accent-light)" }}>
                See all spot →
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {spotDeals.map((s) => (
                <div
                  key={s.id}
                  className="card-hover p-4"
                  style={{ borderLeft: "2px solid var(--amber)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <a href={`/provider/${s.provider_slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--amber)" }}>
                      {s.provider_name}
                    </a>
                    {s.location && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.location}</span>}
                  </div>
                  <div className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                    {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
                    {s.gpu_vram_gb ? ` ${s.gpu_vram_gb}GB` : ""}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {s.price_hourly && (
                        <span className="text-lg font-bold tabular-nums" style={{ color: "var(--amber)", letterSpacing: "-0.03em" }}>
                          ${s.price_hourly.toFixed(2)}<span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>/hr</span>
                        </span>
                      )}
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{ background: "rgba(251,191,36,0.1)", color: "var(--amber)", border: "1px solid rgba(251,191,36,0.25)" }}
                    >
                      Rent →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Providers ── */}
      <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Covered Providers</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Live pricing from {providers.length} providers
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providerStats.map((p) => (
              <a key={p.id} href={`/provider/${p.slug}`} className="card-hover flex items-start gap-3 p-4">
                <ProviderLogo slug={p.slug} name={p.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    {p.credits_usd != null && p.credits_usd > 0 && (
                      <span className="shrink-0 text-xs font-semibold rounded px-1.5 py-0.5"
                        style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.25)", fontSize: "10px" }}>
                        ${p.credits_usd} free
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{p.serverCount} servers</span>
                    {p.cheapestGpu?.price_hourly && (
                      <span style={{ color: "var(--accent-light)" }}>
                        GPU from ${p.cheapestGpu.price_hourly.toFixed(2)}/hr
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ letterSpacing: "-0.04em" }}>
            <span className="gradient-text">Stop overpaying for GPUs.</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            Prices across providers can vary 3–5× for identical hardware. GPUHunt shows you all of them at once.
          </p>
          <a href="/servers?min_gpu_count=1" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            Compare all GPU servers now
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>
    </div>
  );
}
