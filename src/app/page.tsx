import { getServers, getGpuModels, getProviders, getServerCount } from "@/lib/db";

const GPU_META: Record<string, { tier: string; badge: string }> = {
  "H100":   { tier: "flagship", badge: "badge-green"  },
  "H200":   { tier: "flagship", badge: "badge-green"  },
  "A100":   { tier: "flagship", badge: "badge-cyan"   },
  "A40":    { tier: "pro",      badge: "badge-indigo" },
  "A6000":  { tier: "pro",      badge: "badge-indigo" },
  "L40S":   { tier: "pro",      badge: "badge-cyan"   },
  "L40":    { tier: "pro",      badge: "badge-cyan"   },
  "4090":   { tier: "consumer", badge: "badge-amber"  },
  "3090":   { tier: "consumer", badge: "badge-amber"  },
  "V100":   { tier: "legacy",   badge: "badge-muted"  },
};

function gpuMeta(model: string) {
  for (const [key, val] of Object.entries(GPU_META)) {
    if (model.includes(key)) return val;
  }
  return { tier: "other", badge: "badge-muted" };
}

function fmt(price: number | null, currency: string) {
  if (!price) return "—";
  return `${currency === "EUR" ? "€" : "$"}${price.toFixed(0)}`;
}

export default function HomePage() {
  const totalServers = getServerCount({ available_only: true });
  const gpuCount    = getServerCount({ min_gpu_count: 1, available_only: true });
  const gpuModels   = getGpuModels();
  const providers   = getProviders();
  const featured    = getServers({ min_gpu_count: 1, sort_by: "price_monthly", limit: 9 });
  const ticker      = getServers({ min_gpu_count: 1, sort_by: "price_monthly", limit: 18 });
  const cheapH100   = getServers({ gpu_model: "NVIDIA H100", sort_by: "price_monthly", limit: 1 })[0];
  const cheapA100   = getServers({ gpu_model: "NVIDIA A100", sort_by: "price_monthly", limit: 1 })[0];

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
                  {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD ", "")}
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
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="badge badge-indigo">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glow-pulse 2s ease-in-out infinite" }} />
              Live · {providers.length} providers · Updated 6h
            </span>
          </div>

          <h1 className="font-bold leading-none mb-5 tracking-tight"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.8rem)", letterSpacing: "-0.04em" }}>
            <span className="gradient-text">Find the cheapest</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>GPU server.</span>
          </h1>

          <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
            {totalServers.toLocaleString()} servers. {gpuCount.toLocaleString()} GPU-ready.
            Compare H100, A100, RTX&nbsp;4090 and more — side by side, no signup.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a href="/servers?min_gpu_count=1" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
              Browse GPU Servers
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="/servers" className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
              All Servers
            </a>
          </div>

          {/* Cheapest-of pills */}
          {(cheapH100 || cheapA100) && (
            <div className="flex flex-wrap justify-center gap-3">
              {cheapH100 && (
                <div className="glass rounded-lg px-4 py-2 text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Cheapest H100 · </span>
                  <span className="font-bold tabular-nums" style={{ color: "var(--green)" }}>
                    {fmt(cheapH100.price_monthly, cheapH100.currency)}/mo
                  </span>
                  <span style={{ color: "var(--text-muted)" }}> @ {cheapH100.provider_name}</span>
                </div>
              )}
              {cheapA100 && (
                <div className="glass rounded-lg px-4 py-2 text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Cheapest A100 · </span>
                  <span className="font-bold tabular-nums" style={{ color: "var(--cyan)" }}>
                    {fmt(cheapA100.price_monthly, cheapA100.currency)}/mo
                  </span>
                  <span style={{ color: "var(--text-muted)" }}> @ {cheapA100.provider_name}</span>
                </div>
              )}
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
            { value: gpuModels.length.toString(),   label: "GPU models",        sub: "H100 · A100 · more" },
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

      {/* ── Browse by GPU ── */}
      {gpuModels.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Browse by GPU</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {gpuModels.length} GPU models from {providers.length} providers
                </p>
              </div>
              <a href="/servers?min_gpu_count=1" className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>View all →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {gpuModels.slice(0, 15).map((gpu) => {
                const meta = gpuMeta(gpu.gpu_model);
                return (
                  <a key={gpu.gpu_model} href={`/servers?gpu_model=${encodeURIComponent(gpu.gpu_model)}`} className="card-hover block p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                        {gpu.gpu_model.replace("NVIDIA ", "").replace("AMD ", "")}
                      </div>
                      <span className={`badge ${meta.badge} shrink-0`} style={{ fontSize: "9px" }}>
                        {meta.tier.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {gpu.count} listing{gpu.count !== 1 ? "s" : ""}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Best Deals ── */}
      {featured.length > 0 && (
        <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Best GPU Deals Right Now</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Lowest priced GPU servers available today</p>
              </div>
              <a href="/servers?min_gpu_count=1" className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
                See all {gpuCount} →
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((s, idx) => {
                const meta = gpuMeta(s.gpu_model ?? "");
                return (
                  <div
                    key={s.id}
                    className={idx === 0 ? "gradient-border" : "card-hover"}
                    style={{ padding: "20px", position: "relative" }}
                  >
                    {idx === 0 && (
                      <div className="absolute top-3 right-3 badge badge-green" style={{ fontSize: "9px" }}>
                        BEST DEAL
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.provider_name}</span>
                      {s.location && <span className="badge badge-muted" style={{ fontSize: "10px" }}>{s.location}</span>}
                    </div>
                    <span className={`badge ${meta.badge} mb-3 inline-flex`}>
                      {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD ", "")}
                    </span>
                    <div className="text-xs space-y-0.5 mb-4" style={{ color: "var(--text-muted)" }}>
                      {s.cpu_cores && <div>{s.cpu_cores} CPU cores{s.ram_gb ? ` · ${s.ram_gb} GB RAM` : ""}</div>}
                      {s.gpu_vram_gb && <div>{s.gpu_vram_gb} GB VRAM per GPU</div>}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold tabular-nums" style={{ letterSpacing: "-0.04em" }}>
                          {fmt(s.price_monthly, s.currency)}
                        </span>
                        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>/mo</span>
                        {s.price_hourly && (
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{fmt(s.price_hourly, s.currency)}/hr</div>
                        )}
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                      >
                        Get server
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    </div>
                  </div>
                );
              })}
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
              Live pricing from {providers.length} providers, refreshed every 6 hours
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providers.map((p) => (
              <a key={p.id} href={`/provider/${p.slug}`} className="card-hover flex items-start gap-3 p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--accent-light)" }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{p.description}</div>
                  )}
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
