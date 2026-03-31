import { getProviderBySlug, getServersByProvider, getProviders } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) return { title: "Provider Not Found — GPUHunt" };
  return {
    title: `${provider.name} Server Pricing — GPUHunt`,
    description: `Compare all ${provider.name} dedicated and GPU server pricing. ${provider.description ?? ""}`,
  };
}

export async function generateStaticParams() {
  const providers = getProviders();
  return providers.map((p) => ({ slug: p.slug }));
}

export default async function ProviderPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const servers = getServersByProvider(slug);
  const gpuServers = servers.filter((s) => s.gpu_count > 0);
  const cheapest = servers
    .filter((s) => s.price_monthly != null)
    .sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0))[0];
  const cheapestGpu = gpuServers
    .filter((s) => s.price_monthly != null)
    .sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0))[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <a href="/servers" className="hover:text-white transition-colors">Servers</a>
        <span>/</span>
        <span style={{ color: "var(--accent)" }}>{provider.name}</span>
      </div>

      {/* Provider header card */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{provider.name}</h1>
            {provider.description && (
              <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
                {provider.description}
              </p>
            )}
            <a
              href={provider.affiliate_url ?? provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent inline-flex items-center px-4 py-2 text-xs mt-4"
            >
              Visit {provider.name} →
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 sm:gap-8 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">
                {servers.length.toLocaleString()}
              </div>
              <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Servers
              </div>
            </div>
            {gpuServers.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {gpuServers.length}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  GPU servers
                </div>
              </div>
            )}
            {cheapest?.price_monthly != null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">
                  {cheapest.currency === "EUR" ? "€" : "$"}{cheapest.price_monthly.toFixed(0)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  From /mo
                </div>
              </div>
            )}
            {cheapestGpu?.price_monthly != null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">
                  {cheapestGpu.currency === "EUR" ? "€" : "$"}{cheapestGpu.price_monthly.toFixed(0)}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  GPU from /mo
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
