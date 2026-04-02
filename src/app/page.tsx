import type { ReactNode } from "react";
import { getProviders, getServerCount, getGpuFamilyCounts, getBestDealsPerFamily, getServers } from "@/lib/db";
import { BLOG_POSTS } from "@/lib/blog-posts";
import ProviderLogo from "@/components/ProviderLogo";
import HeroSearch from "@/components/HeroSearch";

// Providers that are peer marketplaces / spot-only
const MARKETPLACE_PROVIDERS = ["vast", "salad"];

// SVG icons for use cases — no emojis
const USE_CASE_ICONS: Record<string, ReactNode> = {
  "llm-training": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      <path d="M7 7h2v2H7zM11 7h2v2h-2zM15 7h2v2h-2zM7 11h2v2H7zM11 11h2v2h-2zM15 11h2v2h-2z"/>
    </svg>
  ),
  "inference": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  "fine-tuning": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  "image-generation": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  "embedding": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
};

const USE_CASES = [
  { slug: "llm-training",    label: "LLM Training",      desc: "H100, A100, MI300X",  color: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.25)", iconColor: "var(--accent-light)" },
  { slug: "inference",        label: "AI Inference",       desc: "L40S, L4, RTX 4090", color: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.22)", iconColor: "var(--cyan)"         },
  { slug: "fine-tuning",      label: "Fine-Tuning",        desc: "A100, L40S, A40",    color: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.22)", iconColor: "var(--green)"        },
  { slug: "image-generation", label: "Image Generation",   desc: "RTX 4090, A40, L40S",color: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.22)", iconColor: "var(--amber)"        },
  { slug: "embedding",        label: "Embeddings & RAG",   desc: "L4, A10, T4",        color: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)",iconColor: "var(--red)"          },
];

export default function HomePage() {
  const totalServers = getServerCount({ available_only: true });
  const gpuCount     = getServerCount({ min_gpu_count: 1, available_only: true });
  const providers    = getProviders();
  const gpuFamilies  = getGpuFamilyCounts();

  // Enrich providers with cheapest GPU
  const providerStats = providers.map((p) => {
    const cheapestGpu = getServers({ provider: p.slug, min_gpu_count: 1, sort_by: "price_hourly", available_only: true, limit: 1 })[0] ?? null;
    const serverCount = getServerCount({ provider: p.slug, available_only: true });
    return { ...p, cheapestGpu, serverCount };
  });

  // Hot deals — one per GPU family (no marketplace)
  const hotDeals = getBestDealsPerFamily({
    exclude_providers: MARKETPLACE_PROVIDERS,
    limit: 6,
  });

  // Spot deals from marketplaces
  const spotDeals = MARKETPLACE_PROVIDERS.flatMap((slug) =>
    getServers({ provider: slug, min_gpu_count: 1, sort_by: "price_hourly", available_only: true, limit: 1 })
  ).filter(Boolean);

  // Ticker
  const tickerRaw = getServers({
    min_gpu_count: 1,
    sort_by: "price_monthly",
    exclude_providers: MARKETPLACE_PROVIDERS,
    available_only: true,
    limit: 80,
  });
  const tickerByProvider = tickerRaw.reduce<Record<string, typeof tickerRaw>>((acc, s) => {
    (acc[s.provider_slug] ??= []).push(s);
    return acc;
  }, {});
  const tickerQueues = Object.values(tickerByProvider).map((q) => q.slice(0, 3));
  const ticker: typeof tickerRaw = [];
  const maxLen = Math.max(...tickerQueues.map((q) => q.length));
  for (let i = 0; i < maxLen; i++) {
    for (const queue of tickerQueues) {
      if (queue[i]) ticker.push(queue[i]);
    }
  }

  // Top GPU models for "Popular searches"
  const popularGpus = [
    { model: "NVIDIA H100",         label: "H100"    },
    { model: "NVIDIA A100",         label: "A100"    },
    { model: "NVIDIA L40S",         label: "L40S"    },
    { model: "AMD Instinct MI300X", label: "MI300X"  },
    { model: "NVIDIA RTX 4090",     label: "RTX 4090"},
    { model: "NVIDIA L4",           label: "L4"      },
  ].map((p) => ({
    ...p,
    price: getServers({ gpu_model: p.model, sort_by: "price_hourly", available_only: true, limit: 1 })[0]?.price_hourly ?? null,
  })).filter((p) => p.price !== null);

  // FAQ structured data
  const cheapestH100    = getServers({ gpu_model: "NVIDIA H100", sort_by: "price_hourly", exclude_providers: MARKETPLACE_PROVIDERS, available_only: true, limit: 1 })[0];
  const cheapestA100    = getServers({ gpu_model: "NVIDIA A100", sort_by: "price_hourly", exclude_providers: MARKETPLACE_PROVIDERS, available_only: true, limit: 1 })[0];
  const cheapestRtx4090 = getServers({ gpu_model: "NVIDIA RTX 4090", sort_by: "price_hourly", available_only: true, limit: 1 })[0];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is the cheapest H100 cloud GPU?", acceptedAnswer: { "@type": "Answer", text: cheapestH100 ? `The cheapest H100 is currently on ${cheapestH100.provider_name} at $${cheapestH100.price_hourly!.toFixed(2)}/hr. Compare all H100 providers at https://gpu-hunt.com/gpu/NVIDIA%20H100` : "Compare H100 pricing across providers at https://gpu-hunt.com/gpu/NVIDIA%20H100" } },
      { "@type": "Question", name: "How much does an A100 GPU cost per hour?", acceptedAnswer: { "@type": "Answer", text: cheapestA100 ? `A100 cloud GPU pricing starts at $${cheapestA100.price_hourly!.toFixed(2)}/hr on ${cheapestA100.provider_name}. See all A100 options at https://gpu-hunt.com/gpu/NVIDIA%20A100` : "A100 pricing varies by provider. See current prices at https://gpu-hunt.com/gpu/NVIDIA%20A100" } },
      { "@type": "Question", name: "Which cloud provider has the cheapest GPU?", acceptedAnswer: { "@type": "Answer", text: `GPU pricing varies by model and region. Marketplace providers like Vast.ai often have the lowest spot prices, while dedicated providers like Lambda Labs and CoreWeave offer more stability. Compare all ${providers.length} providers at https://gpu-hunt.com/providers` } },
      { "@type": "Question", name: "Where can I rent an RTX 4090 by the hour?", acceptedAnswer: { "@type": "Answer", text: cheapestRtx4090 ? `RTX 4090 rentals start at $${cheapestRtx4090.price_hourly!.toFixed(2)}/hr on ${cheapestRtx4090.provider_name}. See all options at https://gpu-hunt.com/gpu/NVIDIA%20RTX%204090` : "RTX 4090 rentals are available on RunPod, Vast.ai, TensorDock. See prices at https://gpu-hunt.com/gpu/NVIDIA%20RTX%204090" } },
      { "@type": "Question", name: "What GPU is best for LLM training?", acceptedAnswer: { "@type": "Answer", text: "For LLM training, the NVIDIA H100 SXM5 (80GB) is the top choice for large models. The A100 80GB is a cost-effective alternative. See recommendations at https://gpu-hunt.com/use-case/llm-training" } },
    ],
  };

  const recentPosts = [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Live price ticker ── */}
      {ticker.length > 0 && (
        <div className="overflow-hidden py-2 text-xs select-none"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="ticker-track">
            {[...ticker, ...ticker].map((s, i) => (
              <span key={i} className="flex items-center gap-2 px-5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{s.provider_name}</span>
                <span className="font-medium" style={{ color: "var(--accent-light)" }}>
                  {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                </span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {s.currency === "EUR" ? "€" : "$"}{s.price_monthly?.toFixed(0)}/mo
                </span>
                <span style={{ color: "var(--border-hover)" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          HERO — Full viewport, Kayak-style
      ════════════════════════════════════════════════ */}
      <section
        className="relative bg-grid overflow-hidden"
        style={{
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          paddingTop: "60px",
          paddingBottom: "80px",
        }}
      >
        {/* Multi-layer background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 90% 70% at 50% -5%, rgba(99,102,241,0.22) 0%, transparent 60%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 40% at 80% 60%, rgba(34,211,238,0.06) 0%, transparent 50%)",
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }} />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6">
          {/* Live badge */}
          <div className="flex justify-center mb-7">
            <span className="badge badge-indigo" style={{ fontSize: "12px", padding: "5px 14px", gap: "7px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glow-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
              Live · {providers.length} providers · {gpuCount.toLocaleString()} GPU servers
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-bold text-center leading-none mb-5 tracking-tight"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.05em" }}
          >
            <span className="gradient-text">Find the cheapest<br />AI GPU — instantly.</span>
          </h1>

          <p
            className="text-center mb-10 max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
          >
            One search across {providers.length}+ cloud GPU providers —
            H100, A100, MI300X, RTX 4090 and more. Always free.
          </p>

          {/* ── Tabbed search widget — full width of container ── */}
          <HeroSearch gpuFamilies={gpuFamilies} providers={providers} />

          {/* Popular searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Popular:</span>
            {popularGpus.map((p) => (
              <a
                key={p.model}
                href={`/gpu/${encodeURIComponent(p.model)}`}
                className="glass rounded-full px-3.5 py-1.5 text-xs transition-opacity hover:opacity-80 tabular-nums"
              >
                <span style={{ color: "var(--text-secondary)" }}>{p.label} </span>
                <span className="font-bold" style={{ color: "var(--accent-light)" }}>
                  from ${p.price!.toFixed(2)}/hr
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4">
          {[
            { value: totalServers.toLocaleString(), label: "Servers tracked",  sub: "available now"      },
            { value: gpuCount.toLocaleString(),     label: "GPU servers",       sub: "NVIDIA & AMD"       },
            { value: gpuFamilies.length.toString(), label: "GPU models",        sub: "H100 · A100 · more" },
            { value: providers.length.toString(),   label: "Providers",         sub: "global coverage"    },
          ].map((s, i) => (
            <div key={s.label}
              className={`text-center py-7 ${i === 0 ? "border-r" : i === 1 ? "sm:border-r" : i === 2 ? "border-r" : ""}`}
              style={{ borderColor: "var(--border)" }}>
              <div className="font-bold tabular-nums mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.04em", color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          WHAT ARE YOU BUILDING? — Kayak category tabs
      ════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>By Use Case</p>
            <h2 className="font-bold tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.04em" }}>
              What are you building?
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
              Get matched to the right GPU for your workload
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {USE_CASES.map((uc, i) => (
              <a
                key={uc.slug}
                href={`/use-case/${uc.slug}`}
                className={`usecase-tile ${["usecase-tile-indigo","usecase-tile-cyan","usecase-tile-green","usecase-tile-amber","usecase-tile-red"][i]} flex flex-col items-center text-center rounded-2xl`}
                style={{
                  background: uc.color,
                  border: `1.5px solid ${uc.border}`,
                  padding: "28px 16px",
                  textDecoration: "none",
                }}
              >
                <span style={{ color: uc.iconColor, marginBottom: "14px", display: "block", opacity: 0.9 }}>
                  {USE_CASE_ICONS[uc.slug]}
                </span>
                <div className="font-bold text-white mb-1.5" style={{ fontSize: "13px", letterSpacing: "-0.01em" }}>{uc.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{uc.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOT GPU DEALS — Kayak hotel-card style
      ════════════════════════════════════════════════ */}
      {hotDeals.length > 0 && (
        <section className="py-20 px-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>Best prices today</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="glow-dot" />
                  <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.04em" }}>
                    Hot GPU deals right now
                  </h2>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Best price per GPU family — updated live
                </p>
              </div>
              <a href="/servers?min_gpu_count=1" className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
                View all {gpuCount} servers →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotDeals.map((deal) => {
                // Pick a gradient per GPU tier
                const gpuName = (deal.gpu_model ?? "").toLowerCase();
                const headerGrad = gpuName.includes("h100") || gpuName.includes("h200") || gpuName.includes("b200")
                  ? "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 100%)"
                  : gpuName.includes("a100") || gpuName.includes("mi300")
                  ? "linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.03) 100%)"
                  : gpuName.includes("l40") || gpuName.includes("a40")
                  ? "linear-gradient(135deg, rgba(52,211,153,0.16) 0%, rgba(52,211,153,0.03) 100%)"
                  : "linear-gradient(135deg, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.02) 100%)";
                const accentColor = gpuName.includes("h100") || gpuName.includes("h200") || gpuName.includes("b200")
                  ? "var(--accent-light)"
                  : gpuName.includes("a100") || gpuName.includes("mi300")
                  ? "var(--cyan)"
                  : gpuName.includes("l40") || gpuName.includes("a40")
                  ? "var(--green)"
                  : "var(--amber)";

                return (
                  <div
                    key={deal.id}
                    className="deal-card rounded-2xl overflow-hidden"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Colored gradient header strip */}
                    <div style={{ background: headerGrad, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ProviderLogo slug={deal.provider_slug} name={deal.provider_name} size={20} />
                          <a href={`/provider/${deal.provider_slug}`} className="text-sm font-semibold transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
                            {deal.provider_name}
                          </a>
                        </div>
                        {deal.location && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{deal.location}</span>
                        )}
                      </div>
                    </div>

                    {/* GPU details */}
                    <div className="px-5 py-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="font-bold text-white mb-2" style={{ fontSize: "17px", letterSpacing: "-0.02em" }}>
                            {deal.gpu_count}× {deal.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {deal.gpu_vram_gb && (
                              <span className="badge badge-indigo" style={{ fontSize: "10px" }}>{deal.gpu_vram_gb}GB VRAM</span>
                            )}
                            {deal.ram_gb && (
                              <span className="badge badge-muted" style={{ fontSize: "10px" }}>{deal.ram_gb}GB RAM</span>
                            )}
                            {deal.cpu && (
                              <span className="badge badge-muted" style={{ fontSize: "10px", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {deal.cpu.split(" ").slice(0, 3).join(" ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          {deal.price_hourly != null && (
                            <>
                              <div className="font-bold tabular-nums" style={{ fontSize: "26px", color: accentColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                ${deal.price_hourly.toFixed(2)}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>/hr</div>
                            </>
                          )}
                          {deal.price_monthly != null && deal.price_hourly == null && (
                            <>
                              <div className="font-bold tabular-nums" style={{ fontSize: "26px", color: accentColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                {deal.currency === "EUR" ? "€" : "$"}{deal.price_monthly.toFixed(0)}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>/mo</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <a
                          href={deal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2.5 text-sm font-bold rounded-xl text-white"
                          style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Rent now →
                        </a>
                        <a
                          href={`/gpu/${encodeURIComponent(deal.gpu_model ?? "")}`}
                          className="btn-ghost px-4 py-2.5 text-sm rounded-xl"
                        >
                          Compare
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SPOT & MARKETPLACE — deal alert section
      ════════════════════════════════════════════════ */}
      {spotDeals.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)",
              border: "1.5px solid rgba(251,191,36,0.25)",
            }}>
              <div className="px-8 py-6" style={{ borderBottom: "1px solid rgba(251,191,36,0.15)" }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge badge-amber" style={{ fontSize: "10px" }}>SPOT PRICING</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Variable availability · up to 70% off</span>
                    </div>
                    <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
                      Cheapest GPU deals anywhere
                    </h2>
                  </div>
                  <a href="/servers?min_gpu_count=1" className="btn-ghost px-5 py-2.5 text-sm whitespace-nowrap rounded-xl">
                    See all spot →
                  </a>
                </div>
              </div>

              <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {spotDeals.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5"
                    style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
                    <div>
                      <div className="text-xs font-bold mb-1" style={{ color: "var(--amber)" }}>{s.provider_name}</div>
                      <div className="text-sm font-semibold text-white">
                        {s.gpu_count}× {s.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
                        {s.gpu_vram_gb ? ` ${s.gpu_vram_gb}GB` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      {s.price_hourly && (
                        <div className="font-bold tabular-nums" style={{ fontSize: "20px", color: "var(--amber)", letterSpacing: "-0.03em" }}>
                          ${s.price_hourly.toFixed(2)}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>/hr</span>
                        </div>
                      )}
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold mt-0.5 block" style={{ color: "var(--amber)" }}>
                        Rent →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          BROWSE BY GPU MODEL — destination grid
      ════════════════════════════════════════════════ */}
      {gpuFamilies.length > 0 && (
        <section className="py-20 px-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>All GPU models</p>
                <h2 className="font-bold tracking-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.04em" }}>Browse by GPU</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {gpuFamilies.length} GPU models — click any to compare all providers
                </p>
              </div>
              <a href="/gpus" className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
                All GPU types →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {gpuFamilies.map((gpu) => (
                <a
                  key={gpu.family}
                  href={`/gpu/${encodeURIComponent(gpu.family)}`}
                  className="card-hover block p-4 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
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
                    <div className="text-sm mt-1.5 font-bold tabular-nums" style={{ color: "var(--accent-light)", letterSpacing: "-0.02em" }}>
                      from ${gpu.cheapest.toFixed(2)}/hr
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          PRICE ALERTS — Track Prices CTA
      ════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl text-center overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(34,211,238,0.08) 50%, rgba(99,102,241,0.06) 100%)",
              border: "1.5px solid rgba(99,102,241,0.3)",
              padding: "64px 40px",
            }}
          >
            {/* Decorative glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
            }} />
            <div className="relative">
              <div style={{ marginBottom: "16px" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
              <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.04em" }}>
                Track GPU prices like a pro
              </h2>
              <p className="mb-8 max-w-lg mx-auto" style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.65 }}>
                GPU prices shift daily. Set your target price — we&apos;ll alert you the moment H100 or A100 rates drop to your budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/servers?min_gpu_count=1" className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl" style={{ padding: "14px 28px", fontSize: "15px" }}>
                  Set Price Alert
                </a>
                <a href="/best-value" className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl" style={{ padding: "14px 28px", fontSize: "15px" }}>
                  Best value right now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PROVIDERS — All Providers grid
      ════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>Every major provider</p>
              <h2 className="font-bold tracking-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.04em" }}>
                {providers.length}+ GPU cloud providers
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Compared side by side, updated live
              </p>
            </div>
            <a href="/providers" className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
              Full comparison →
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providerStats.map((p) => (
              <a key={p.id} href={`/provider/${p.slug}`} className="card-hover flex items-start gap-3 p-4 rounded-xl">
                <ProviderLogo slug={p.slug} name={p.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <div className="text-sm font-bold truncate" style={{ letterSpacing: "-0.02em" }}>{p.name}</div>
                    {p.credits_usd != null && p.credits_usd > 0 && (
                      <span className="shrink-0 text-xs font-bold rounded px-1.5 py-0.5"
                        style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.25)", fontSize: "10px" }}>
                        ${p.credits_usd} free
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{p.serverCount} servers</span>
                    {p.cheapestGpu?.price_hourly && (
                      <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>
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

      {/* ════════════════════════════════════════════════
          GPU GUIDES — Travel Tips style
      ════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>Expert advice</p>
              <h2 className="font-bold tracking-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.04em" }}>
                GPU Cloud Guides
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                How to choose and save on AI compute
              </p>
            </div>
            <a href="/blog" className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
              All guides →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {recentPosts.map((post, idx) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="blog-card flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                }}
              >
                {/* Blog card image area */}
                <div style={{
                  height: "120px",
                  background: idx === 0
                    ? "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(34,211,238,0.1) 100%)"
                    : idx === 1
                    ? "linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(99,102,241,0.1) 100%)"
                    : "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(248,113,113,0.08) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                }}>
                  {idx === 0
                    ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    : idx === 1
                    ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  }
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="badge badge-indigo" style={{ fontSize: "10px" }}>{tag}</span>
                    ))}
                  </div>
                  <h3 className="font-bold text-white mb-2 flex-1 leading-snug" style={{ fontSize: "15px", letterSpacing: "-0.02em" }}>
                    {post.title}
                  </h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                    {post.description.slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{post.readTime} min read</span>
                    <span className="font-semibold" style={{ color: "var(--accent-light)" }}>Read guide →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bold mb-5" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.05em" }}>
            <span className="gradient-text">Stop overpaying for GPUs.</span>
          </h2>
          <p className="mb-8 max-w-lg mx-auto" style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.65 }}>
            Prices across providers vary 3–5× for identical hardware. GPUHunt shows you all of them at once, for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/servers?min_gpu_count=1" className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl" style={{ padding: "15px 32px", fontSize: "15px" }}>
              Compare all GPU servers
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="/best-value" className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl" style={{ padding: "15px 32px", fontSize: "15px" }}>
              Best value GPUs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
