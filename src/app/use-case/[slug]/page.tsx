import { getServers } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface UseCase {
  slug: string;
  title: string;
  headline: string;
  description: string;
  why: string[];
  gpuFamilies: string[];       // prefix-match GPU families to highlight
  minGpuCount?: number;
  sortBy: "price_monthly" | "gpu_count" | "ram_gb" | "gpu_vram_gb";
  excludeProviders?: string[];
}

const USE_CASES: UseCase[] = [
  {
    slug: "llm-training",
    title: "Best GPUs for LLM Training",
    headline: "Best GPU Servers for LLM Training",
    description: "Training large language models demands the highest memory bandwidth and NVLink interconnects. H100 SXM5 and MI300X are the gold standard. Compare live pricing across every cloud provider.",
    why: [
      "H100 SXM5 delivers 3.35 TB/s HBM3 memory bandwidth — critical for large model parallelism",
      "MI300X has 192 GB of unified HBM3 memory, fitting larger models on a single GPU",
      "Multi-GPU NVLink (H100) or Infinity Fabric (MI300X) interconnects are required for tensor parallelism at scale",
      "A100 SXM4 remains competitive for smaller runs at significantly lower cost",
    ],
    gpuFamilies: ["NVIDIA H100", "NVIDIA A100", "AMD Instinct MI300X", "AMD Instinct MI325X", "AMD Instinct MI355X", "NVIDIA H200", "NVIDIA B200"],
    minGpuCount: 1,
    sortBy: "price_monthly",
    excludeProviders: ["vast", "salad"],
  },
  {
    slug: "inference",
    title: "Best GPUs for AI Inference",
    headline: "Best GPU Servers for AI Inference",
    description: "Inference workloads need high throughput per dollar, not raw training speed. L40S, L4, and A10 hit the sweet spot between VRAM, compute, and cost. Compare live pricing across all providers.",
    why: [
      "L40S offers 48 GB GDDR6 with Ada Lovelace architecture — 2× the inference throughput of A100 per dollar",
      "L4 is purpose-built for inference: low power, 24 GB VRAM, runs 7B–13B models efficiently",
      "A10 / A10G are workhorses for high-concurrency serving at a fraction of H100 cost",
      "RTX 4090 is viable for small models and prototyping at consumer pricing",
    ],
    gpuFamilies: ["NVIDIA L40S", "NVIDIA L40", "NVIDIA L4", "NVIDIA A10", "NVIDIA RTX 4090", "NVIDIA A100"],
    minGpuCount: 1,
    sortBy: "price_monthly",
    excludeProviders: ["vast", "salad"],
  },
  {
    slug: "fine-tuning",
    title: "Best GPUs for Fine-Tuning LLMs",
    headline: "Best GPU Servers for Fine-Tuning",
    description: "Fine-tuning requires sufficient VRAM for the model + gradients + optimizer states. A single H100 or A100 handles most open-source models. Compare the cheapest options across all providers.",
    why: [
      "Fine-tuning a 7B model in full precision needs ~56 GB VRAM — a single A100 (80 GB) handles it",
      "QLoRA / PEFT methods can cut VRAM to ~16–24 GB, making A40 and L40S viable",
      "H100 finishes fine-tuning runs faster, but A100 at lower cost is often better economics",
      "Multi-GPU is rarely needed for fine-tuning — single-node setups work for most models",
    ],
    gpuFamilies: ["NVIDIA H100", "NVIDIA A100", "NVIDIA L40S", "NVIDIA A40", "AMD Instinct MI300X"],
    minGpuCount: 1,
    sortBy: "price_monthly",
    excludeProviders: ["vast", "salad"],
  },
  {
    slug: "image-generation",
    title: "Best GPUs for AI Image Generation",
    headline: "Best GPU Servers for Image Generation",
    description: "Stable Diffusion, Flux, and other diffusion models run well on consumer-class GPUs. RTX 4090 and A40 offer excellent throughput-per-dollar for image gen workloads.",
    why: [
      "Flux.1 dev needs 24 GB VRAM for full quality — A40, L40S, or RTX 4090 are ideal",
      "Stable Diffusion XL runs on 12–16 GB VRAM — RTX 3090, A5000, or L4 work well",
      "Batch generation throughput scales linearly with GPU count — multi-GPU configs make sense for high-volume pipelines",
      "Consumer GPUs (RTX 4090) offer the cheapest $/image for light workloads",
    ],
    gpuFamilies: ["NVIDIA RTX 4090", "NVIDIA A40", "NVIDIA L40S", "NVIDIA L4", "NVIDIA RTX 3090", "NVIDIA A6000"],
    minGpuCount: 1,
    sortBy: "price_monthly",
  },
  {
    slug: "embedding",
    title: "Best GPUs for Embedding & RAG",
    headline: "Best GPU Servers for Embeddings & RAG",
    description: "Generating embeddings and running RAG pipelines is memory-bandwidth-bound, not compute-bound. Smaller, cheaper GPUs handle it well. Find the best price-per-query options.",
    why: [
      "Embedding models (e.g. text-embedding-3, BGE, E5) are lightweight — L4 and A10 are overkill-priced efficiently",
      "RAG retrieval is CPU/memory bound; GPU is only needed for the embedding step",
      "T4 and A10 hit the best $/million-tokens for embedding workloads",
      "For high-concurrency embedding APIs, multiple small GPUs beat one large one",
    ],
    gpuFamilies: ["NVIDIA L4", "NVIDIA A10", "NVIDIA RTX 4090", "NVIDIA A40", "NVIDIA L40S"],
    minGpuCount: 1,
    sortBy: "price_monthly",
  },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uc = USE_CASES.find((u) => u.slug === slug);
  if (!uc) return { title: "Use Case — GPUHunt" };
  return {
    title: `${uc.title} — GPUHunt`,
    description: uc.description,
  };
}

export async function generateStaticParams() {
  return USE_CASES.map((uc) => ({ slug: uc.slug }));
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const uc = USE_CASES.find((u) => u.slug === slug);
  if (!uc) notFound();

  // Gather servers for all GPU families in this use case
  const allServers = [];
  const seenIds = new Set<string>();
  for (const family of uc.gpuFamilies) {
    const servers = getServers({
      gpu_model: family,
      min_gpu_count: uc.minGpuCount,
      available_only: true,
      sort_by: uc.sortBy,
      exclude_providers: uc.excludeProviders,
      limit: 100,
    });
    for (const s of servers) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        allServers.push(s);
      }
    }
  }

  // Sort the combined list by price
  allServers.sort((a, b) => {
    const pa = a.price_monthly ?? a.price_hourly ?? Infinity;
    const pb = b.price_monthly ?? b.price_hourly ?? Infinity;
    return pa - pb;
  });

  const cheapest = allServers.filter((s) => s.price_hourly != null)[0];
  const uniqueProviders = [...new Set(allServers.map((s) => s.provider_name))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span>Use Cases</span>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>{uc.headline}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ letterSpacing: "-0.03em" }}>
          {uc.headline}
        </h1>
        <p className="text-base max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          {uc.description}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold text-white tabular-nums">{allServers.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Options</div>
        </div>
        {cheapest?.price_hourly != null && (
          <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              ${cheapest.price_hourly.toFixed(2)}
            </div>
            <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>From /hr</div>
          </div>
        )}
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold text-white tabular-nums">{uniqueProviders.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Providers</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold text-white tabular-nums">{uc.gpuFamilies.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU types</div>
        </div>
      </div>

      {/* Why these GPUs */}
      <div className="rounded-xl p-6 mb-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold text-white mb-4">What to look for</h2>
        <ul className="space-y-2">
          {uc.why.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }}>→</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* GPU family quick-links */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Recommended GPU families
        </div>
        <div className="flex flex-wrap gap-2">
          {uc.gpuFamilies.map((family) => (
            <a key={family} href={`/servers?gpu_model=${encodeURIComponent(family)}`}>
              <span className="badge badge-cyan" style={{ fontSize: "12px" }}>
                {family.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Results */}
      {allServers.length > 0 ? (
        <ServerTable servers={allServers} />
      ) : (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          No servers found for this use case. Check back soon.
        </div>
      )}

      {/* Cross-links */}
      <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>RELATED USE CASES</h3>
        <div className="flex flex-wrap gap-2">
          {USE_CASES.filter((u) => u.slug !== slug).map((u) => (
            <a key={u.slug} href={`/use-case/${u.slug}`} className="badge badge-muted text-xs">
              {u.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
