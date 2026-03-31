"use client";

import { ServerWithProvider } from "@/lib/types";
import { useState } from "react";

interface ServerTableProps {
  servers: ServerWithProvider[];
}

type SortKey = "price_monthly" | "price_hourly" | "gpu_count" | "ram_gb" | "gpu_vram_gb" | "cpu_cores";

export default function ServerTable({ servers: initialServers }: ServerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("price_monthly");
  const [sortAsc, setSortAsc] = useState(true);

  const servers = [...initialServers].sort((a, b) => {
    const aVal = a[sortKey] ?? Infinity;
    const bVal = b[sortKey] ?? Infinity;
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field;
    return (
      <th
        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
        style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
        onClick={() => handleSort(field)}
      >
        {label}{" "}
        {active ? (
          <span style={{ color: "var(--accent)" }}>{sortAsc ? "↑" : "↓"}</span>
        ) : (
          <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>↕</span>
        )}
      </th>
    );
  }

  function formatPrice(price: number | null, currency: string): string {
    if (price === null) return "—";
    const symbol = currency === "EUR" ? "€" : "$";
    return `${symbol}${price.toFixed(2)}`;
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
      <table className="min-w-full">
        <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <tr>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Provider
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Server
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              GPU
            </th>
            <SortHeader label="GPUs" field="gpu_count" />
            <SortHeader label="VRAM" field="gpu_vram_gb" />
            <SortHeader label="Cores" field="cpu_cores" />
            <SortHeader label="RAM" field="ram_gb" />
            <SortHeader label="$/mo" field="price_monthly" />
            <SortHeader label="$/hr" field="price_hourly" />
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Location
            </th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {servers.map((server, i) => (
            <tr
              key={server.id}
              className="transition-colors group"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <td className="px-3 py-3 text-sm">
                <a
                  href={`/provider/${server.provider_slug}`}
                  className="transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color = "var(--text-secondary)")
                  }
                >
                  {server.provider_name}
                </a>
              </td>
              <td
                className="px-3 py-3 text-sm font-medium max-w-48 truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {server.name}
              </td>
              <td className="px-3 py-3 text-sm">
                {server.gpu_model ? (
                  <span
                    className="font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    {server.gpu_model}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {server.gpu_count > 0 ? `${server.gpu_count}×` : "—"}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {server.gpu_vram_gb ? `${server.gpu_vram_gb} GB` : "—"}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {server.cpu_cores ?? "—"}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {server.ram_gb ? `${server.ram_gb} GB` : "—"}
              </td>
              <td className="px-3 py-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatPrice(server.price_monthly, server.currency)}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {server.price_hourly ? formatPrice(server.price_hourly, server.currency) : "—"}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {server.location ?? "—"}
              </td>
              <td className="px-3 py-3 text-sm">
                <a
                  href={server.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#000" }}
                >
                  View →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {servers.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          No servers match your filters.
        </div>
      )}
    </div>
  );
}
