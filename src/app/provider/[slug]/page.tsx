import { getProviderBySlug, getServersByProvider, getProviders } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import ProviderLogo from "@/components/ProviderLogo";
import { getProviderSLA, uptimeColor, uptimeBadgeClass } from "@/lib/provider-sla";
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
    title: `${provider.name} GPU Cloud Pricing — All Plans & Specs | GPUHunt`,
    description: `Live ${provider.name} GPU server pricing. Compare H100, A100, and all available instances. ${provider.description ?? ""}`.trim(),
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: provider.name,
    url: provider.website,
    description: provider.description ?? `${provider.name} GPU and bare metal server pricing.`,
  };
  const cheapest = servers
    .filter((s) => s.price_monthly != null)
    .sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0))[0];
  const cheapestGpu = gpuServers
    .filter((s) => s.price_monthly != null)
    .sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0))[0];

  const sla = getProviderSLA(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <div className="flex items-center gap-3 mb-2">
              <ProviderLogo slug={provider.slug} name={provider.name} size={32} />
              <h1 className="text-2xl font-bold text-white">{provider.name}</h1>
            </div>
            {provider.description && (
              <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
                {provider.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <a
                href={provider.affiliate_url ?? provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
              >
                Visit {provider.name} →
              </a>
              {provider.credits_usd != null && provider.credits_usd > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "var(--green)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M3 4l3-3 3 3M2 9h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ${provider.credits_usd} free credits
                </span>
              )}
            </div>
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

      {/* SLA & Trust card */}
      {sla && (
        <div className="rounded-xl p-6 mb-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--text-muted)" }}>
            SLA &amp; Trust
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">

            {/* Uptime */}
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Uptime SLA</div>
              <div className="flex items-center gap-2">
                <span className={`badge ${uptimeBadgeClass(sla.uptime_numeric)}`} style={{ fontSize: "11px" }}>
                  {sla.uptime_sla}
                </span>
              </div>
            </div>

            {/* SLA Credits */}
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Downtime Credits</div>
              <div className="text-sm font-semibold" style={{ color: sla.sla_credits ? "var(--green)" : "var(--text-muted)" }}>
                {sla.sla_credits ? "✓ Yes" : "✗ No"}
              </div>
            </div>

            {/* GDPR */}
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>GDPR Compliant</div>
              <div className="text-sm font-semibold" style={{ color: sla.gdpr ? "var(--green)" : "var(--text-muted)" }}>
                {sla.gdpr ? "✓ Yes" : "✗ No"}
              </div>
            </div>

            {/* Status page */}
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Status Page</div>
              {sla.status_page ? (
                <a
                  href={sla.status_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--accent-light)" }}
                >
                  View status ↗
                </a>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>None</span>
              )}
            </div>

            {/* Support */}
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Support</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{sla.support}</div>
            </div>

          </div>

          {/* Billing models */}
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Billing Models</div>
            <div className="flex flex-wrap gap-1.5">
              {sla.billing.map((b) => (
                <span key={b} className="badge badge-muted" style={{ fontSize: "11px" }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {sla.certifications.length > 0 && (
            <div className="mt-4">
              <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Certifications</div>
              <div className="flex flex-wrap gap-1.5">
                {sla.certifications.map((c) => (
                  <span key={c} className="badge badge-indigo" style={{ fontSize: "11px" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interconnect */}
          {sla.interconnect && (
            <div className="mt-4">
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Network Interconnect</div>
              <div className="text-xs" style={{ color: "var(--accent-light)" }}>{sla.interconnect}</div>
            </div>
          )}

          {/* Notes */}
          {sla.notes && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sla.notes}</div>
            </div>
          )}
        </div>
      )}

      <ServerTable servers={servers} />
    </div>
  );
}
