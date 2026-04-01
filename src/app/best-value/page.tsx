import { getServers } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Value GPU Servers — Highest FLOPS Per Dollar | GPUHunt",
  description:
    "Find the best value GPU servers for AI/ML workloads. Ranked by FP16 TFLOPS per dollar per hour — the most useful metric for training and inference cost efficiency.",
};

// Known FP16 TFLOPS per GPU model (single GPU)
const FP16_TFLOPS: Record<string, number> = {
  "NVIDIA B200":          2250,
  "NVIDIA B300":          2457,
  "NVIDIA H200":          989,
  "NVIDIA H100":          989,
  "NVIDIA GH200":         1000,
  "NVIDIA A100":          312,
  "NVIDIA L40S":          362,
  "NVIDIA L40":           181,
  "NVIDIA L4":            121,
  "NVIDIA A40":           149.7,
  "NVIDIA A10":           125,
  "NVIDIA A10G":          125,
  "NVIDIA V100":          125,
  "NVIDIA RTX 4090":      165,
  "NVIDIA RTX 4080":      97.5,
  "NVIDIA RTX 3090":      71,
  "NVIDIA RTX 3080":      45,
  "NVIDIA RTX 6000 Ada":  364,
  "NVIDIA RTX A6000":     154.8,
  "NVIDIA RTX A5000":     107.6,
  "AMD Instinct MI300X":  1307,
  "AMD Instinct MI325X":  1307,
  "AMD Instinct MI355X":  2457,
  "AMD Instinct MI250":   362,
};

function getTflops(gpuModel: string): number | null {
  for (const [key, val] of Object.entries(FP16_TFLOPS)) {
    if (gpuModel.startsWith(key)) return val;
  }
  return null;
}

export default function BestValuePage() {
  // Get all GPU servers, exclude marketplace (vast/salad)
  const servers = getServers({
    min_gpu_count: 1,
    available_only: true,
    exclude_providers: ["vast", "salad"],
    limit: 500,
  }).filter((s) => s.price_hourly != null && s.gpu_model != null);

  // Score each: total FP16 TFLOPS / price_hourly
  const scored = servers
    .map((s) => {
      const tflopsPerGpu = getTflops(s.gpu_model!);
      if (!tflopsPerGpu) return null;
      const totalTflops = tflopsPerGpu * (s.gpu_count || 1);
      const tflopsPerDollar = totalTflops / s.price_hourly!;
      return { ...s, totalTflops, tflopsPerDollar };
    })
    .filter(Boolean)
    .sort((a, b) => b!.tflopsPerDollar - a!.tflopsPerDollar)
    .slice(0, 50) as (typeof servers[0] & { totalTflops: number; tflopsPerDollar: number })[];

  // Top 3 for callout cards
  const top3 = scored.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Value GPU Servers — Highest FLOPS Per Dollar",
    "description": "GPU servers ranked by FP16 TFLOPS per dollar — the best metric for AI/ML cost efficiency",
    "url": "https://gpu-hunt.com/best-value",
    "numberOfItems": scored.length,
    "itemListElement": scored.slice(0, 10).map((s, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${s.gpu_model} on ${s.provider_name}`,
      "description": `$${s.price_hourly!.toFixed(2)}/hr — ${s.tflopsPerDollar.toFixed(0)} TFLOPS/$`,
      "url": `https://gpu-hunt.com/provider/${s.provider_slug}`,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>Best Value GPUs</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
          Best Value GPU Servers
        </h1>
        <p className="text-base max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Ranked by FP16 TFLOPS per dollar per hour — the most direct measure of AI compute efficiency.
          Higher score = more compute per dollar.
        </p>
      </div>

      {/* Methodology pill */}
      <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 mb-8 text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        <span style={{ color: "var(--accent)" }}>Formula:</span>
        <span className="font-mono">FP16 TFLOPS × GPU count ÷ $/hr</span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <a href="/methodology" className="hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
          Methodology →
        </a>
      </div>

      {/* Top 3 podium cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {top3.map((s, i) => (
            <div
              key={s.id}
              className="rounded-xl p-5"
              style={{
                background: i === 0 ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08))" : "var(--surface)",
                border: `1px solid ${i === 0 ? "rgba(99,102,241,0.35)" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold tabular-nums" style={{ color: i === 0 ? "var(--accent-light)" : "var(--text-muted)" }}>
                  #{i + 1}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {s.provider_name}
                </span>
              </div>
              <div className="text-base font-bold text-white mb-1">
                {s.gpu_count}× {s.gpu_model!.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
              </div>
              <div className="text-2xl font-bold tabular-nums mb-3" style={{ color: "var(--accent)" }}>
                {s.tflopsPerDollar.toFixed(0)} <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>TFLOPS/$</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>${s.price_hourly!.toFixed(2)}/hr</span>
                <span>{s.totalTflops.toLocaleString()} TFLOPS total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServerTable servers={scored} />

      {/* Cross-links */}
      <div className="mt-10 pt-8 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
        {[
          { href: "/use-case/llm-training",   label: "LLM Training picks" },
          { href: "/use-case/inference",       label: "Inference picks" },
          { href: "/use-case/fine-tuning",     label: "Fine-tuning picks" },
          { href: "/gpus",                     label: "All GPU types" },
        ].map((l) => (
          <a key={l.href} href={l.href} className="badge badge-muted text-xs">{l.label}</a>
        ))}
      </div>
    </div>
  );
}
