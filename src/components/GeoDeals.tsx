"use client";

import { useEffect, useState } from "react";
import { ServerWithProvider } from "@/lib/types";
import ProviderLogo from "./ProviderLogo";

const REGION_LABELS: Record<string, { label: string; flag: string }> = {
  us:   { label: "United States",   flag: "🇺🇸" },
  eu:   { label: "Europe",          flag: "🇪🇺" },
  apac: { label: "Asia Pacific",    flag: "🌏" },
};

function fmt(price: number | null, currency?: string) {
  if (!price) return "—";
  return `${currency === "EUR" ? "€" : "$"}${price.toFixed(0)}`;
}

interface Props {
  /** The static/default deals from SSR — shown until geo loads */
  fallback: ServerWithProvider[];
  totalGpuCount: number;
}

export default function GeoDeals({ fallback, totalGpuCount }: Props) {
  const [deals, setDeals] = useState<ServerWithProvider[]>(fallback);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        const geoRes = await fetch("/api/geo");
        const { region: r } = await geoRes.json();

        if (cancelled) return;

        // Only bother fetching regional deals if not already "us" (default)
        if (r && r !== "us") {
          const dealsRes = await fetch(`/api/deals?region=${r}`);
          const data: ServerWithProvider[] = await dealsRes.json();
          if (!cancelled && data.length > 0) {
            setDeals(data);
            setRegion(r);
          } else if (!cancelled) {
            // No regional deals found — keep fallback but tag region anyway
            setRegion(r);
          }
        } else {
          setRegion(r ?? "us");
        }
      } catch {
        // Network error or blocked — silently keep fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  const regionInfo = region ? REGION_LABELS[region] : null;

  return (
    <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                Live GPU Snapshot
              </h2>
              {regionInfo && !loading && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {regionInfo.flag} {regionInfo.label}
                </span>
              )}
              {loading && (
                <span
                  className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
                  style={{ background: "var(--surface)", color: "var(--text-muted)" }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--text-muted)" }} />
                  Locating…
                </span>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Cheapest available price for each GPU type · one provider per card · sorted by $/hr
            </p>
          </div>
          <a href="/servers?min_gpu_count=1" className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--accent-light)" }}>
            See all {totalGpuCount} →
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((s, idx) => (
            <div
              key={s.id}
              className={idx === 0 ? "gradient-border" : "card-hover"}
              style={{ padding: "20px" }}
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                <a
                  href={`/provider/${s.provider_slug}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold transition-colors min-w-0"
                  style={{ color: "var(--accent-light)" }}
                >
                  <ProviderLogo slug={s.provider_slug} name={s.provider_name} size={16} />
                  <span className="truncate">{s.provider_name}</span>
                </a>
                <div className="flex items-center gap-1.5 shrink-0">
                  {idx === 0 && (
                    <span className="badge badge-green" style={{ fontSize: "9px" }}>TOP DEAL</span>
                  )}
                  {s.location && (
                    <span className="badge badge-muted" style={{ fontSize: "10px" }}>{s.location}</span>
                  )}
                </div>
              </div>
              <div className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {s.gpu_count}×{" "}
                {s.gpu_model?.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                {s.gpu_vram_gb ? ` ${s.gpu_vram_gb}GB` : ""}
              </div>
              <div className="text-xs space-y-0.5 mb-4" style={{ color: "var(--text-muted)" }}>
                {s.cpu_cores && (
                  <div>{s.cpu_cores} vCPU{s.ram_gb ? ` · ${s.ram_gb} GB RAM` : ""}</div>
                )}
                {s.storage_type && s.storage_gb && (
                  <div>{s.storage_gb} GB {s.storage_type}</div>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  {s.price_hourly != null && (
                    <div
                      className="text-2xl font-bold tabular-nums"
                      style={{ letterSpacing: "-0.04em" }}
                    >
                      ${s.price_hourly.toFixed(2)}
                      <span className="text-sm font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>
                        /hr
                      </span>
                    </div>
                  )}
                  {s.price_monthly != null && (
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {fmt(s.price_monthly, s.currency)}/mo
                    </div>
                  )}
                </div>
                <a
                  href={s.provider_affiliate_url ?? s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  Get server
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6h7M6.5 3.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Other regions link */}
        {region && region !== "us" && (
          <div className="mt-6 flex gap-2 flex-wrap">
            {Object.entries(REGION_LABELS)
              .filter(([r]) => r !== region)
              .map(([r, info]) => (
                <a
                  key={r}
                  href={`/location/${r}`}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  {info.flag} Show {info.label} deals
                </a>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
