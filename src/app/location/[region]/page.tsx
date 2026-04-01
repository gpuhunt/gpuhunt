import { getServersByLocation, getProviders } from "@/lib/db";
import ServerTable from "@/components/ServerTable";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const REGIONS: Record<string, { label: string; description: string; emoji: string; countries: string }> = {
  us: {
    label: "United States",
    emoji: "🇺🇸",
    description: "GPU cloud pricing from US-based data centers. Best for North American workloads with low latency to US users.",
    countries: "Regions: US East, US West, US Central",
  },
  eu: {
    label: "European Union",
    emoji: "🇪🇺",
    description: "GDPR-compliant GPU cloud pricing from EU data centers. Best for European workloads, data residency requirements, and regulatory compliance.",
    countries: "Regions: Germany, France, Netherlands, Finland, Sweden, Norway, Poland, Spain, and more",
  },
  apac: {
    label: "Asia Pacific",
    emoji: "🌏",
    description: "GPU cloud pricing from Asia Pacific data centers. Best for low-latency access to users in Asia, Australia, and the Pacific.",
    countries: "Regions: Japan, South Korea, India, Australia, Singapore, Hong Kong, Taiwan",
  },
};

interface PageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  const r = REGIONS[region];
  if (!r) return { title: "Region — GPUHunt" };
  return {
    title: `GPU Servers in ${r.label} — Cloud GPU Pricing | GPUHunt`,
    description: r.description,
  };
}

export async function generateStaticParams() {
  return Object.keys(REGIONS).map((region) => ({ region }));
}

export default async function LocationPage({ params }: PageProps) {
  const { region } = await params;
  const r = REGIONS[region];
  if (!r) notFound();

  const servers = getServersByLocation(region);
  const gpuServers = servers.filter((s) => s.gpu_count > 0);
  const uniqueProviders = [...new Set(servers.map((s) => s.provider_name))];
  const cheapest = gpuServers.filter((s) => s.price_hourly != null)[0];

  // Other regions for cross-linking
  const otherRegions = Object.entries(REGIONS).filter(([k]) => k !== region);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span>Locations</span>
        <span>/</span>
        <span style={{ color: "var(--accent-light)" }}>{r.emoji} {r.label}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: 36 }}>{r.emoji}</span>
          <h1 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
            GPU Servers in {r.label}
          </h1>
        </div>
        <p className="text-base max-w-2xl mb-2" style={{ color: "var(--text-secondary)" }}>
          {r.description}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.countries}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold text-white tabular-nums">{servers.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Listings</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>{gpuServers.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU configs</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-2xl font-bold text-white tabular-nums">{uniqueProviders.length}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Providers</div>
        </div>
        {cheapest?.price_hourly != null && (
          <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--green)" }}>
              ${cheapest.price_hourly.toFixed(2)}
            </div>
            <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cheapest GPU /hr</div>
          </div>
        )}
      </div>

      <ServerTable servers={servers} />

      {/* Other regions */}
      <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>OTHER REGIONS</h3>
        <div className="flex flex-wrap gap-3">
          {otherRegions.map(([slug, reg]) => (
            <a
              key={slug}
              href={`/location/${slug}`}
              className="card-hover rounded-lg px-4 py-3 flex items-center gap-2"
            >
              <span style={{ fontSize: 20 }}>{reg.emoji}</span>
              <span className="text-sm font-medium text-white">{reg.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
