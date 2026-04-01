"use client";

import { ServerWithProvider } from "@/lib/types";
import { useState } from "react";
import ProviderLogo from "./ProviderLogo";

// SLA uptime dot — quick trust signal next to provider name
const SLA_DOT: Record<string, { color: string; title: string }> = {
  "coreweave":    { color: "#22c55e", title: "99.9% SLA"    },
  "vultr":        { color: "#22c55e", title: "100% SLA"     },
  "hyperstack":   { color: "#22c55e", title: "100% SLA"     },
  "oblivus":      { color: "#22c55e", title: "99.995% SLA"  },
  "runpod":       { color: "#22c55e", title: "99.99% SLA (Secure Cloud)" },
  "fluidstack":   { color: "#22c55e", title: "99% SLA"      },
  "ovh":          { color: "#22c55e", title: "99.5% SLA"    },
  "scaleway":     { color: "#22c55e", title: "99.5% SLA"    },
  "hetzner":      { color: "#22c55e", title: "99.9% SLA"    },
  "digitalocean": { color: "#f59e0b", title: "99% SLA (GPU)" },
  "genesis":      { color: "#f59e0b", title: "99.0% SLA"    },
  "datacrunch":   { color: "#f59e0b", title: "~99.9% SLA"   },
  "latitude":     { color: "#f59e0b", title: "Hardware repair SLA, no uptime %" },
  "tensordock":   { color: "#f59e0b", title: "99.99% host quality" },
  "lambda-labs":  { color: "#6b7280", title: "No published SLA" },
  "paperspace":   { color: "#6b7280", title: "No published SLA" },
  "vast":         { color: "#6b7280", title: "No SLA (marketplace)" },
  "salad":        { color: "#6b7280", title: "~90-95% per node (distributed)" },
  "jarvislabs":   { color: "#6b7280", title: "No SLA"       },
  "thundercompute":{ color: "#6b7280", title: "No published SLA" },
};

type SortKey = "price_monthly" | "price_hourly" | "gpu_count" | "ram_gb" | "gpu_vram_gb" | "cpu_cores";

const GPU_BADGE: Record<string, string> = {
  // NVIDIA
  H100:  "badge-green",
  H200:  "badge-green",
  B200:  "badge-green",
  A100:  "badge-cyan",
  L40S:  "badge-cyan",
  L40:   "badge-cyan",
  A40:   "badge-indigo",
  A6000: "badge-indigo",
  "4090":"badge-amber",
  "3090":"badge-amber",
  "4080":"badge-amber",
  // AMD Instinct
  MI300: "badge-green",
  MI325: "badge-green",
  MI355: "badge-green",
  MI250: "badge-cyan",
  MI100: "badge-muted",
};

function gpuBadge(model: string) {
  for (const [key, cls] of Object.entries(GPU_BADGE)) {
    if (model.includes(key)) return cls;
  }
  return "badge-muted";
}

function fmt(price: number | null, currency: string) {
  if (price === null) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  return `${sym}${price.toFixed(2)}`;
}

function fmtShort(price: number | null, currency: string) {
  if (price === null) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  return `${sym}${price < 10000 ? price.toFixed(0) : price.toLocaleString()}`;
}

// Map country/region codes → flag emoji
const LOCATION_FLAGS: Record<string, string> = {
  US:"🇺🇸", CA:"🇨🇦", GB:"🇬🇧", DE:"🇩🇪", FR:"🇫🇷", NL:"🇳🇱",
  FI:"🇫🇮", SE:"🇸🇪", NO:"🇳🇴", PL:"🇵🇱", ES:"🇪🇸", IT:"🇮🇹",
  PT:"🇵🇹", RO:"🇷🇴", CZ:"🇨🇿", SK:"🇸🇰", HU:"🇭🇺", GR:"🇬🇷",
  BG:"🇧🇬", HR:"🇭🇷", SI:"🇸🇮", LT:"🇱🇹", IS:"🇮🇸", IN:"🇮🇳",
  JP:"🇯🇵", NRT:"🇯🇵", KR:"🇰🇷", AU:"🇦🇺", SG:"🇸🇬", HK:"🇭🇰",
  TW:"🇹🇼", TH:"🇹🇭", VN:"🇻🇳", CN:"🇨🇳", BR:"🇧🇷", MX:"🇲🇽",
  EU:"🇪🇺", "EU-FR":"🇫🇷",
};

function locationFlag(loc: string | null): string {
  if (!loc) return "";
  const key = loc.split("-")[0].split("_")[0].toUpperCase();
  return LOCATION_FLAGS[loc.toUpperCase()] ?? LOCATION_FLAGS[key] ?? "";
}

export default function ServerTable({ servers: initial }: { servers: ServerWithProvider[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("price_monthly");
  const [sortAsc, setSortAsc] = useState(true);
  const [compact, setCompact] = useState(false);

  const servers = [...initial].sort((a, b) => {
    const av = a[sortKey] ?? Infinity;
    const bv = b[sortKey] ?? Infinity;
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function Th({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field;
    const thPy = compact ? "py-1.5" : "py-3";
    return (
      <th
        onClick={() => handleSort(field)}
        className={`px-4 ${thPy} text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap`}
        style={{
          color: active ? "var(--accent-light)" : "var(--text-muted)",
          transition: "color 0.15s",
        }}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <span style={{ opacity: active ? 1 : 0.3, color: active ? "var(--accent-light)" : "var(--text-muted)" }}>
            {active ? (sortAsc ? "↑" : "↓") : "↕"}
          </span>
        </span>
      </th>
    );
  }

  if (servers.length === 0) {
    return (
      <div
        className="rounded-xl text-center py-20"
        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-4 opacity-20">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 16h12M16 10v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 16 16)"/>
        </svg>
        <div className="text-sm font-medium">No servers match your filters</div>
        <div className="text-xs mt-1.5">Try adjusting or clearing your filters.</div>
      </div>
    );
  }

  const py = compact ? "py-1.5" : "py-3";

  // ── Mobile card view (hidden on sm+) ──────────────────────────────
  const mobileCards = (
    <div className="block sm:hidden space-y-3">
      {servers.map((s) => (
        <div
          key={s.id}
          className="rounded-xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <a href={`/provider/${s.provider_slug}`} className="inline-flex items-center gap-2">
              <ProviderLogo slug={s.provider_slug} name={s.provider_name} size={18} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{s.provider_name}</span>
              {SLA_DOT[s.provider_slug] && (
                <span title={SLA_DOT[s.provider_slug].title}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: SLA_DOT[s.provider_slug].color, display: "inline-block" }} />
              )}
            </a>
            {s.location && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {locationFlag(s.location)} {s.location}
              </span>
            )}
          </div>

          {/* GPU */}
          {s.gpu_model && (
            <div className="mb-2">
              <a href={`/gpu/${encodeURIComponent(s.gpu_model)}`}>
                <span className={`badge ${gpuBadge(s.gpu_model)}`} style={{ fontSize: "11px" }}>
                  {s.gpu_count > 0 ? `${s.gpu_count}× ` : ""}
                  {s.gpu_model.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                  {s.gpu_vram_gb ? ` ${s.gpu_vram_gb}GB` : ""}
                </span>
              </a>
            </div>
          )}

          {/* Specs row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {s.cpu_cores && <span>{s.cpu_cores} cores</span>}
            {s.ram_gb && <span>{s.ram_gb} GB RAM</span>}
            {s.gpu_vram_gb && s.gpu_count > 0 && (
              <span>{s.gpu_vram_gb * s.gpu_count} GB VRAM total</span>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                {s.price_hourly ? `$${s.price_hourly.toFixed(2)}/hr` : (s.price_monthly ? `$${s.price_monthly.toFixed(0)}/mo` : "—")}
              </div>
              {s.price_hourly && s.gpu_vram_gb && s.gpu_count > 0 && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ${(s.price_hourly / (s.gpu_vram_gb * s.gpu_count)).toFixed(3)}/GB·hr
                </div>
              )}
            </div>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-1 px-4 py-2 text-xs"
            >
              View deal
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2.5l2.5 2.5L5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {servers.length} result{servers.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs mr-1.5" style={{ color: "var(--text-muted)" }}>Density:</span>
          <button
            onClick={() => setCompact(false)}
            className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: !compact ? "var(--accent)" : "var(--surface)",
              color: !compact ? "#fff" : "var(--text-muted)",
              border: "1px solid",
              borderColor: !compact ? "var(--accent)" : "var(--border)",
            }}
          >
            Comfortable
          </button>
          <button
            onClick={() => setCompact(true)}
            className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: compact ? "var(--accent)" : "var(--surface)",
              color: compact ? "#fff" : "var(--text-muted)",
              border: "1px solid",
              borderColor: compact ? "var(--accent)" : "var(--border)",
            }}
          >
            Compact
          </button>
        </div>
      </div>

      {mobileCards}

      <div className="hidden sm:block overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <table className="min-w-full text-sm">
          {/* Header */}
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <th className={`px-4 ${py} text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap`} style={{ color: "var(--text-muted)" }}>
                Provider
              </th>
              <th className={`px-4 ${py} text-left text-xs font-semibold uppercase tracking-wider`} style={{ color: "var(--text-muted)" }}>
                GPU
              </th>
              <Th label="GPUs" field="gpu_count" />
              <Th label="VRAM" field="gpu_vram_gb" />
              <Th label="Cores" field="cpu_cores" />
              <Th label="RAM" field="ram_gb" />
              <Th label="$/mo" field="price_monthly" />
              <Th label="$/hr" field="price_hourly" />
              <th className={`px-4 ${py} text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap`} style={{ color: "var(--text-muted)" }}>
                $/GB·hr
              </th>
              <th className={`px-4 ${py} text-left text-xs font-semibold uppercase tracking-wider`} style={{ color: "var(--text-muted)" }}>
                Location
              </th>
              <th className={`px-4 ${py} w-24`} />
            </tr>
          </thead>

          <tbody>
            {servers.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Provider */}
                <td className={`px-4 ${py} whitespace-nowrap`}>
                  <a
                    href={`/provider/${s.provider_slug}`}
                    className="inline-flex items-center gap-2 text-xs font-medium transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
                  >
                    <ProviderLogo slug={s.provider_slug} name={s.provider_name} size={18} />
                    {s.provider_name}
                    {SLA_DOT[s.provider_slug] && (
                      <span
                        title={SLA_DOT[s.provider_slug].title}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: SLA_DOT[s.provider_slug].color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </a>
                </td>

                {/* GPU */}
                <td className={`px-4 ${py} whitespace-nowrap`}>
                  {s.gpu_model ? (
                    <a href={`/gpu/${encodeURIComponent(s.gpu_model)}`}>
                      <span className={`badge ${gpuBadge(s.gpu_model)}`} style={{ fontSize: "11px" }}>
                        {s.gpu_model.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                      </span>
                    </a>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>

                {/* GPUs count */}
                <td className={`px-4 ${py} text-sm tabular-nums`} style={{ color: "var(--text-secondary)" }}>
                  {s.gpu_count > 0 ? (
                    <span className="font-medium">{s.gpu_count}×</span>
                  ) : "—"}
                </td>

                {/* VRAM */}
                <td className={`px-4 ${py} text-sm tabular-nums`} style={{ color: "var(--text-secondary)" }}>
                  {s.gpu_vram_gb ? `${s.gpu_vram_gb} GB` : "—"}
                </td>

                {/* Cores */}
                <td className={`px-4 ${py} text-sm tabular-nums`} style={{ color: "var(--text-secondary)" }}>
                  {s.cpu_cores ?? "—"}
                </td>

                {/* RAM */}
                <td className={`px-4 ${py} text-sm tabular-nums`} style={{ color: "var(--text-secondary)" }}>
                  {s.ram_gb ? `${s.ram_gb} GB` : "—"}
                </td>

                {/* Monthly price */}
                <td className={`px-4 ${py} whitespace-nowrap`}>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {fmtShort(s.price_monthly, s.currency)}
                  </span>
                  <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>/mo</span>
                </td>

                {/* Hourly price */}
                <td className={`px-4 ${py} text-xs tabular-nums whitespace-nowrap`} style={{ color: "var(--text-muted)" }}>
                  {s.price_hourly ? fmt(s.price_hourly, s.currency) : "—"}
                </td>

                {/* $/GB VRAM per hour */}
                <td className={`px-4 ${py} text-xs tabular-nums whitespace-nowrap`} style={{ color: "var(--text-muted)" }}>
                  {s.price_hourly && s.gpu_vram_gb && s.gpu_count > 0
                    ? (() => {
                        const totalVram = s.gpu_vram_gb * s.gpu_count;
                        const perGb = s.price_hourly / totalVram;
                        const sym = s.currency === "EUR" ? "€" : "$";
                        return `${sym}${perGb < 0.01 ? perGb.toFixed(4) : perGb.toFixed(3)}`;
                      })()
                    : "—"}
                </td>

                {/* Location */}
                <td className={`px-4 ${py} text-xs whitespace-nowrap`} style={{ color: "var(--text-muted)" }}>
                  {s.location
                    ? <>{locationFlag(s.location) && <span className="mr-1">{locationFlag(s.location)}</span>}{s.location}</>
                    : "—"}
                </td>

                {/* Action */}
                <td className={`px-4 ${py}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap"
                  >
                    View
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5 2.5l2.5 2.5L5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
