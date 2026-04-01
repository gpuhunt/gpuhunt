"use client";

import { ServerWithProvider } from "@/lib/types";
import { useState } from "react";

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

export default function ServerTable({ servers: initial }: { servers: ServerWithProvider[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("price_monthly");
  const [sortAsc, setSortAsc] = useState(true);

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
    return (
      <th
        onClick={() => handleSort(field)}
        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
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
        <div className="text-4xl mb-3 opacity-20">⊘</div>
        <div className="text-sm">No servers match your filters.</div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Try adjusting or clearing your filters.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <table className="min-w-full text-sm">
        {/* Header */}
        <thead>
          <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
              Provider
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              GPU
            </th>
            <Th label="GPUs" field="gpu_count" />
            <Th label="VRAM" field="gpu_vram_gb" />
            <Th label="Cores" field="cpu_cores" />
            <Th label="RAM" field="ram_gb" />
            <Th label="$/mo" field="price_monthly" />
            <Th label="$/hr" field="price_hourly" />
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Location
            </th>
            <th className="px-4 py-3 w-24" />
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
              <td className="px-4 py-3 whitespace-nowrap">
                <a
                  href={`/provider/${s.provider_slug}`}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
                >
                  {s.provider_name}
                </a>
              </td>

              {/* GPU */}
              <td className="px-4 py-3 whitespace-nowrap">
                {s.gpu_model ? (
                  <a href={`/servers?gpu_model=${encodeURIComponent(s.gpu_model)}`}>
                    <span className={`badge ${gpuBadge(s.gpu_model)}`} style={{ fontSize: "11px" }}>
                      {s.gpu_model.replace("NVIDIA ", "").replace("AMD Instinct ", "").replace("AMD ", "")}
                    </span>
                  </a>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </td>

              {/* GPUs count */}
              <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {s.gpu_count > 0 ? (
                  <span className="font-medium">{s.gpu_count}×</span>
                ) : "—"}
              </td>

              {/* VRAM */}
              <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {s.gpu_vram_gb ? `${s.gpu_vram_gb} GB` : "—"}
              </td>

              {/* Cores */}
              <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {s.cpu_cores ?? "—"}
              </td>

              {/* RAM */}
              <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {s.ram_gb ? `${s.ram_gb} GB` : "—"}
              </td>

              {/* Monthly price */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {fmtShort(s.price_monthly, s.currency)}
                </span>
                <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>/mo</span>
              </td>

              {/* Hourly price */}
              <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {s.price_hourly ? fmt(s.price_hourly, s.currency) : "—"}
              </td>

              {/* Location */}
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {s.location ?? "—"}
              </td>

              {/* Action */}
              <td className="px-4 py-3">
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
  );
}
