import { getGpuFamilyCounts } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare GPU Types — Cloud GPU Pricing | GPUHunt",
  description:
    "Browse all GPU types available for cloud rental. Compare H100, A100, MI300X, L40S, RTX 4090 and 30+ more GPUs across 20+ providers. Starting prices, averages, and provider counts.",
};

const TIER_LABELS: Record<string, string> = {
  flagship: "Flagship & Data Center",
  pro:      "Professional & Workstation",
  consumer: "Consumer & High-End",
  legacy:   "Previous Generation",
};

const WORKLOAD_GUIDE = [
  {
    icon: "⚙",
    title: "Training & Research",
    desc: "H100, A100, MI300X. Prioritize NVLink, memory bandwidth, and multi-GPU configs.",
    href: "/use-case/llm-training",
  },
  {
    icon: "⚡",
    title: "Inference & Production",
    desc: "L40S, L4, A10. Optimize for throughput-per-dollar and low latency.",
    href: "/use-case/inference",
  },
  {
    icon: "🔬",
    title: "Fine-Tuning",
    desc: "A100, H100 (single GPU). 80 GB VRAM handles most open-source models.",
    href: "/use-case/fine-tuning",
  },
  {
    icon: "🖼",
    title: "Image Generation",
    desc: "RTX 4090, A40, L40S. 24–48 GB VRAM, high throughput per dollar.",
    href: "/use-case/image-generation",
  },
];

export default function GpusPage() {
  const families = getGpuFamilyCounts();

  // Group by tier
  const tiers = ["flagship", "pro", "consumer", "legacy"] as const;
  const byTier = Object.fromEntries(
    tiers.map((t) => [t, families.filter((f) => f.tier === t)])
  );

  const totalConfigs = families.reduce((s, f) => s + f.count, 0);
  const cheapestGlobal = Math.min(...families.map((f) => f.cheapest ?? Infinity).filter(isFinite));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Cloud GPU Types — GPUHunt",
    "description": "All GPU models available for cloud rental with live pricing",
    "url": "https://gpu-hunt.com/gpus",
    "numberOfItems": families.length,
    "itemListElement": families.map((f, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": f.label,
      "url": `https://gpu-hunt.com/gpu/${encodeURIComponent(f.family)}`,
      "description": f.cheapest ? `${f.label} from $${f.cheapest.toFixed(2)}/hr across ${f.providers} providers` : f.label,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>GPU Types</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
          Cloud GPU Types
        </h1>
        <p className="text-base max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Compare pricing across {families.length} GPU families, {totalConfigs}+ configurations, and 20+ providers.
          From ${cheapestGlobal.toFixed(2)}/hr.
        </p>
      </div>

      {/* Market stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "GPU types",     value: families.length.toString() },
          { label: "Configs",       value: `${totalConfigs}+` },
          { label: "Providers",     value: "20+" },
          { label: "From",          value: `$${cheapestGlobal.toFixed(2)}/hr` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-xl font-bold text-white tabular-nums">{s.value}</div>
            <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Workload guide */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Choose by workload
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKLOAD_GUIDE.map((w) => (
            <a key={w.href} href={w.href} className="card-hover rounded-xl p-4 block">
              <div className="text-xl mb-2">{w.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{w.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* GPU families by tier */}
      {tiers.map((tier) => {
        const gpus = byTier[tier];
        if (!gpus || gpus.length === 0) return null;
        return (
          <div key={tier} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              {TIER_LABELS[tier]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {gpus.map((gpu) => {
                const savePct = gpu.cheapest && gpu.avg
                  ? Math.round((1 - gpu.cheapest / gpu.avg) * 100)
                  : null;
                return (
                  <a
                    key={gpu.family}
                    href={`/servers?gpu_model=${encodeURIComponent(gpu.family)}`}
                    className="card-hover rounded-xl p-4 block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`badge ${gpu.badge}`} style={{ fontSize: "11px" }}>
                        {gpu.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {gpu.providers} provider{gpu.providers !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {gpu.cheapest != null && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>From</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                            ${gpu.cheapest.toFixed(2)}/hr
                          </span>
                        </div>
                      )}
                      {gpu.avg != null && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Avg</span>
                          <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            ${gpu.avg.toFixed(2)}/hr
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {gpu.count} config{gpu.count !== 1 ? "s" : ""}
                      </span>
                      {savePct != null && savePct > 5 && (
                        <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>
                          Save up to {savePct}%
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
