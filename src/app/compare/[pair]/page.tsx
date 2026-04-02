import {
  getProviderBySlug,
  getProviders,
  getServersByProvider,
  getProviderGpuOverlap,
} from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ pair: string }>;
}

// Parse "lambda-labs-vs-runpod" → ["lambda-labs", "runpod"]
function parsePair(pair: string): [string, string] | null {
  const idx = pair.indexOf("-vs-");
  if (idx === -1) return null;
  return [pair.slice(0, idx), pair.slice(idx + 4)];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) return { title: "Comparison — GPUHunt" };
  const [slugA, slugB] = parsed;
  const provA = getProviderBySlug(slugA);
  const provB = getProviderBySlug(slugB);
  if (!provA || !provB) return { title: "Comparison — GPUHunt" };
  return {
    title: `${provA.name} vs ${provB.name} GPU Pricing — GPUHunt`,
    description: `Side-by-side comparison of ${provA.name} and ${provB.name} GPU server pricing. Find which provider offers cheaper H100, A100, and other GPU instances.`,
  };
}

export async function generateStaticParams() {
  const providers = getProviders();
  const params: { pair: string }[] = [];
  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      params.push({ pair: `${providers[i].slug}-vs-${providers[j].slug}` });
      params.push({ pair: `${providers[j].slug}-vs-${providers[i].slug}` });
    }
  }
  return params;
}

export default async function ComparisonPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();
  const [slugA, slugB] = parsed;

  const provA = getProviderBySlug(slugA);
  const provB = getProviderBySlug(slugB);
  if (!provA || !provB) notFound();

  const serversA = getServersByProvider(slugA).filter((s) => s.available === 1);
  const serversB = getServersByProvider(slugB).filter((s) => s.available === 1);
  const overlap = getProviderGpuOverlap(slugA, slugB);

  const cheapestA = serversA.filter((s) => s.price_hourly != null).sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0];
  const cheapestB = serversB.filter((s) => s.price_hourly != null).sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0];
  const gpuServersA = serversA.filter((s) => s.gpu_count > 0);
  const gpuServersB = serversB.filter((s) => s.gpu_count > 0);
  const cheapestGpuA = gpuServersA.filter((s) => s.price_hourly != null).sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0];
  const cheapestGpuB = gpuServersB.filter((s) => s.price_hourly != null).sort((a, b) => (a.price_hourly ?? 0) - (b.price_hourly ?? 0))[0];

  const gpuModelsA = [...new Set(gpuServersA.map((s) => s.gpu_model).filter(Boolean))];
  const gpuModelsB = [...new Set(gpuServersB.map((s) => s.gpu_model).filter(Boolean))];

  // Verdict: which is cheaper for GPU compute?
  const gpuHourlyA = cheapestGpuA?.price_hourly;
  const gpuHourlyB = cheapestGpuB?.price_hourly;
  let verdict = "";
  if (gpuHourlyA != null && gpuHourlyB != null) {
    const diff = Math.abs(gpuHourlyA - gpuHourlyB);
    const pct = Math.round((diff / Math.max(gpuHourlyA, gpuHourlyB)) * 100);
    if (gpuHourlyA < gpuHourlyB) {
      verdict = `${provA.name} starts ${pct}% cheaper for GPU compute ($${gpuHourlyA.toFixed(2)}/hr vs $${gpuHourlyB.toFixed(2)}/hr).`;
    } else if (gpuHourlyB < gpuHourlyA) {
      verdict = `${provB.name} starts ${pct}% cheaper for GPU compute ($${gpuHourlyB.toFixed(2)}/hr vs $${gpuHourlyA.toFixed(2)}/hr).`;
    } else {
      verdict = `${provA.name} and ${provB.name} are priced the same for entry-level GPU compute.`;
    }
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "GPUHunt", item: "https://gpu-hunt.com" },
      { "@type": "ListItem", position: 2, name: "Compare Providers", item: "https://gpu-hunt.com/providers" },
      { "@type": "ListItem", position: 3, name: `${provA.name} vs ${provB.name}`, item: `https://gpu-hunt.com/compare/${pair}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span>Compare</span>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>{provA.name} vs {provB.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
          {provA.name} vs {provB.name}
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          GPU server pricing comparison — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        {verdict && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--accent-light)" }}>Quick verdict: </span>
            {verdict}
          </div>
        )}
      </div>

      {/* Side-by-side stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {[
          { prov: provA, servers: serversA, gpuServers: gpuServersA, cheapestGpu: cheapestGpuA, gpuModels: gpuModelsA },
          { prov: provB, servers: serversB, gpuServers: gpuServersB, cheapestGpu: cheapestGpuB, gpuModels: gpuModelsB },
        ].map(({ prov, servers, gpuServers, cheapestGpu, gpuModels }) => (
          <div key={prov.slug} className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{prov.name}</h2>
                {prov.description && (
                  <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--text-muted)" }}>{prov.description}</p>
                )}
              </div>
              <a
                href={prov.affiliate_url ?? prov.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
              >
                Visit →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">{gpuServers.length}</div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU configs</div>
              </div>
              {cheapestGpu?.price_hourly != null && (
                <div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                    ${cheapestGpu.price_hourly.toFixed(2)}
                  </div>
                  <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU from /hr</div>
                </div>
              )}
            </div>
            {gpuModels.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="text-xs mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU models</div>
                <div className="flex flex-wrap gap-1.5">
                  {gpuModels.slice(0, 8).map((m) => (
                    <a key={m} href={`/servers?gpu_model=${encodeURIComponent(m!)}`}>
                      <span className="badge badge-cyan" style={{ fontSize: "10px" }}>
                        {m!.replace("NVIDIA ", "").replace("AMD Instinct ", "")}
                      </span>
                    </a>
                  ))}
                  {gpuModels.length > 8 && (
                    <span className="badge badge-muted" style={{ fontSize: "10px" }}>+{gpuModels.length - 8} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overlap section */}
      {overlap.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3 text-white">
            GPUs available on both providers
          </h2>
          <div className="flex flex-wrap gap-2">
            {overlap.map((m) => (
              <a key={m} href={`/servers?gpu_model=${encodeURIComponent(m)}`}>
                <span className="badge badge-green" style={{ fontSize: "12px" }}>
                  {m.replace("NVIDIA ", "").replace("AMD Instinct ", "")} — compare prices →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Full server lists */}
      <div className="space-y-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{provA.name} — All listings</h2>
            <a href={`/provider/${provA.slug}`} className="text-xs" style={{ color: "var(--accent)" }}>
              View full profile →
            </a>
          </div>
          <ServerTable servers={serversA} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{provB.name} — All listings</h2>
            <a href={`/provider/${provB.slug}`} className="text-xs" style={{ color: "var(--accent)" }}>
              View full profile →
            </a>
          </div>
          <ServerTable servers={serversB} />
        </div>
      </div>

      {/* Other comparisons */}
      <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
          MORE COMPARISONS
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href={`/compare/${provB.slug}-vs-${provA.slug}`} className="badge badge-muted text-xs">
            {provB.name} vs {provA.name}
          </a>
          <a href={`/provider/${provA.slug}`} className="badge badge-muted text-xs">
            All {provA.name} servers
          </a>
          <a href={`/provider/${provB.slug}`} className="badge badge-muted text-xs">
            All {provB.name} servers
          </a>
          <a href="/servers?min_gpu_count=1" className="badge badge-muted text-xs">
            All GPU servers
          </a>
        </div>
      </div>
    </div>
  );
}
