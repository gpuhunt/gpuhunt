import { getProviders } from "@/lib/db";
import ProviderLogo from "@/components/ProviderLogo";
import { getAllProviderSLAs, uptimeBadgeClass } from "@/lib/provider-sla";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare GPU Cloud Providers — SLA, Support & Pricing",
  description:
    "Side-by-side comparison of 20+ GPU cloud providers. Compare uptime SLAs, support tiers, billing models, GDPR compliance, certifications, and starting prices.",
};

const TIER_LABEL: Record<string, string> = {
  enterprise: "Enterprise",
  startup: "Cloud",
  marketplace: "Marketplace / Spot",
};

const TIER_DESC: Record<string, string> = {
  enterprise: "Formal SLAs, dedicated support, compliance certs",
  startup: "Developer-friendly, good price/performance",
  marketplace: "Lowest prices, variable reliability",
};

export default function ProvidersPage() {
  const providers = getProviders();
  const slaMap = getAllProviderSLAs();

  // Enrich providers with SLA data
  const enriched = providers.map((p) => ({
    ...p,
    sla: slaMap[p.slug] ?? null,
  }));

  // Group by tier
  const tiers = ["enterprise", "startup", "marketplace"] as const;
  const byTier = Object.fromEntries(
    tiers.map((t) => [
      t,
      enriched.filter((p) => p.sla?.tier === t || (t === "startup" && !p.sla)),
    ])
  );

  const totalProviders = providers.length;
  const withSla = enriched.filter((p) => p.sla?.uptime_numeric != null).length;
  const gdprCount = enriched.filter((p) => p.sla?.gdpr).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "GPU Cloud Providers Comparison — GPUHunt",
    "description": `Compare ${totalProviders} GPU cloud providers by SLA, pricing, support, and compliance`,
    "url": "https://gpu-hunt.com/providers",
    "numberOfItems": totalProviders,
    "itemListElement": providers.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.name,
      "url": `https://gpu-hunt.com/provider/${p.slug}`,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>Providers</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
          GPU Cloud Providers
        </h1>
        <p className="text-base max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Compare {totalProviders} providers on price, uptime SLA, support tiers, GDPR compliance, and certifications —
          not just the cheapest GPU.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Providers", value: totalProviders.toString() },
          { label: "With uptime SLA", value: `${withSla}` },
          { label: "GDPR compliant", value: `${gdprCount}` },
          { label: "With status page", value: `${enriched.filter((p) => p.sla?.status_page).length}` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
            <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tier sections */}
      {tiers.map((tier) => {
        const group = byTier[tier];
        if (!group || group.length === 0) return null;
        return (
          <div key={tier} className="mb-12">
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {TIER_LABEL[tier]}
              </h2>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{TIER_DESC[tier]}</span>
            </div>

            {/* Provider comparison table */}
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    {["Provider", "Uptime SLA", "Credits", "GDPR", "Certifications", "Billing", "Support", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.map((p, i) => {
                    const sla = p.sla;
                    return (
                      <tr
                        key={p.id}
                        style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                      >
                        {/* Provider name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`/provider/${p.slug}`} className="inline-flex items-center gap-2 group">
                            <ProviderLogo slug={p.slug} name={p.name} size={20} />
                            <span className="text-sm font-medium text-white group-hover:text-white transition-colors">
                              {p.name}
                            </span>
                            {p.credits_usd != null && p.credits_usd > 0 && (
                              <span className="text-xs font-semibold rounded px-1.5 py-0.5"
                                style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.25)", fontSize: "10px" }}>
                                ${p.credits_usd} free
                              </span>
                            )}
                          </a>
                        </td>

                        {/* Uptime SLA */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sla ? (
                            <span className={`badge ${uptimeBadgeClass(sla.uptime_numeric)}`} style={{ fontSize: "11px" }}>
                              {sla.uptime_sla}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>

                        {/* SLA credits */}
                        <td className="px-4 py-3 text-sm" style={{ color: sla?.sla_credits ? "var(--green)" : "var(--text-muted)" }}>
                          {sla ? (sla.sla_credits ? "✓" : "✗") : "—"}
                        </td>

                        {/* GDPR */}
                        <td className="px-4 py-3 text-sm" style={{ color: sla?.gdpr ? "var(--green)" : "var(--text-muted)" }}>
                          {sla ? (sla.gdpr ? "✓" : "✗") : "—"}
                        </td>

                        {/* Certifications */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {sla?.certifications.slice(0, 3).map((c) => (
                              <span key={c} className="badge badge-indigo" style={{ fontSize: "10px" }}>{c}</span>
                            ))}
                            {(sla?.certifications.length ?? 0) === 0 && (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Billing */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {sla?.billing.slice(0, 2).map((b) => (
                              <span key={b} className="badge badge-muted" style={{ fontSize: "10px" }}>{b}</span>
                            ))}
                          </div>
                        </td>

                        {/* Support */}
                        <td className="px-4 py-3 text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                          <span className="line-clamp-2">{sla?.support ?? "—"}</span>
                        </td>

                        {/* Status page */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sla?.status_page ? (
                            <a
                              href={sla.status_page}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs transition-colors"
                              style={{ color: "var(--accent-light)" }}
                            >
                              Live ↗
                            </a>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <a
                            href={`/provider/${p.slug}`}
                            className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap"
                          >
                            View
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5h6M5 2.5l2.5 2.5L5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Explanation */}
      <div className="mt-4 rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-3 text-white">How to read this</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <div>
            <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Uptime SLA</div>
            The provider&apos;s contractual uptime guarantee. <span style={{ color: "var(--green)" }}>Green = 99.9%+</span>, <span style={{ color: "var(--accent-light)" }}>blue = 99%+</span>, <span style={{ color: "var(--amber)" }}>amber = below 99%</span>. "No SLA" means best-effort with no contractual obligation.
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Downtime Credits</div>
            Whether the provider issues account credits when they miss their SLA. Important for production workloads — it creates accountability even if cash refunds aren&apos;t offered.
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Marketplace vs Cloud</div>
            Marketplace providers (Vast.ai, Salad, TensorDock) aggregate 3rd-party hardware — prices are lowest but reliability varies by host. Cloud providers run their own infrastructure with consistent performance.
          </div>
        </div>
      </div>
    </div>
  );
}
