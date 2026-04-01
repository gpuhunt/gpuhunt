import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How GPUHunt Works — Data Sources & Methodology",
  description:
    "How GPUHunt collects, normalizes, and displays GPU server pricing data. Our data sources, update frequency, and pricing methodology explained.",
};

const SECTIONS = [
  {
    title: "What we track",
    content: `GPUHunt aggregates GPU and bare metal server pricing from 20+ cloud providers including Lambda Labs, CoreWeave, RunPod, Vast.ai, DigitalOcean, Hetzner, Scaleway, Oblivus, and more. We focus exclusively on GPU compute relevant to AI/ML workloads — H100, A100, MI300X, L40S, RTX 4090, and similar chips used for training, fine-tuning, and inference.`,
  },
  {
    title: "How pricing is collected",
    content: `Prices are scraped directly from provider pricing pages and APIs on an automated schedule. For providers with public APIs, we query current on-demand pricing directly. For providers without APIs, we maintain curated price tables that are manually verified and updated regularly. All prices shown are on-demand (pay-as-you-go) unless otherwise noted. Reserved, spot, or contract pricing is not shown unless explicitly labeled.`,
  },
  {
    title: "Price normalization",
    content: `All prices are normalized to a per-hour basis. Monthly prices are calculated as hourly × 730 (average hours/month). Prices in EUR are stored and displayed with the € symbol; USD prices use $. We do not perform live currency conversion — EUR-priced providers (e.g. Hetzner, OVHcloud, Scaleway) show their native pricing. GPU model names are normalized to a canonical form (e.g. "NVIDIA H100 SXM5", "AMD Instinct MI300X") to enable cross-provider comparison.`,
  },
  {
    title: "$/GB VRAM metric",
    content: `The $/GB·hr column shows the hourly cost per gigabyte of total GPU VRAM in the configuration. For multi-GPU nodes, total VRAM = per-GPU VRAM × GPU count. This metric lets engineers compare the true memory cost across different GPU types and configurations. An H100 80GB at $2.50/hr costs $0.031/GB·hr, while an RTX 4090 24GB at $0.40/hr costs $0.017/GB·hr — useful when your bottleneck is VRAM, not compute.`,
  },
  {
    title: "Availability",
    content: `Availability status reflects what we observed at last scrape time. "Available" means the provider listed the configuration as orderable at time of scrape. Actual availability may differ — some providers show all SKUs regardless of stock. We recommend checking directly with the provider before planning workloads around specific configurations.`,
  },
  {
    title: "What we don't show",
    content: `We do not include: spot/preemptible pricing (too variable), custom enterprise contracts, academic or startup credit programs, or bundled pricing that includes storage/networking separately from compute. We do not show CPU-only instances. Vast.ai and Salad Cloud are marketplace providers where individual users list their own hardware — their pricing is shown in a separate section and may not reflect the same reliability guarantees as cloud providers.`,
  },
  {
    title: "Affiliate disclosure",
    content: `Some provider links on GPUHunt include affiliate tracking parameters. When you click through and sign up or make a purchase, we may receive a referral commission from the provider. This does not affect pricing, ranking, or how providers are ordered in results — all comparison tables are sorted by price, not affiliate relationship. We disclose all affiliate relationships.`,
  },
  {
    title: "Errors and corrections",
    content: `If you find a pricing error, missing provider, or incorrect GPU spec, please email support@gpu-hunt.com. We take data accuracy seriously and will correct verified errors within 24 hours. Provider pricing can change without notice — always verify current pricing directly with the provider before committing to a workload.`,
  },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>Methodology</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
        How GPUHunt Works
      </h1>
      <p className="text-base mb-12" style={{ color: "var(--text-secondary)" }}>
        Our data sources, collection methodology, and how we normalize pricing across 20+ providers.
      </p>

      <div className="space-y-10">
        {SECTIONS.map((s, i) => (
          <div key={i}>
            <h2 className="text-base font-semibold text-white mb-3">{s.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", lineHeight: "1.75" }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-14 rounded-xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="text-sm font-semibold text-white mb-2">Found an error?</div>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Pricing data changes frequently. If something looks wrong, let us know and we'll fix it.
        </p>
        <a
          href="mailto:support@gpu-hunt.com"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          Report an issue
        </a>
      </div>
    </div>
  );
}
