"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterSidebarProps {
  gpuModels: { gpu_model: string; count: number }[];
  providers: { slug: string; name: string }[];
}

const inputStyle = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
  appearance: "none" as const,
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

export default function FilterSidebar({ gpuModels, providers }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("offset");
      router.push(`/servers?${params.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters =
    searchParams.get("gpu_model") ||
    searchParams.get("provider") ||
    searchParams.get("max_price") ||
    searchParams.get("min_ram") ||
    searchParams.get("min_gpu_count");

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-5">
      {/* GPU Model */}
      <div>
        <label style={labelStyle}>GPU Model</label>
        <select
          style={inputStyle}
          value={searchParams.get("gpu_model") || ""}
          onChange={(e) => updateParam("gpu_model", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        >
          <option value="">All GPUs</option>
          {gpuModels.map((g) => (
            <option key={g.gpu_model} value={g.gpu_model}>
              {g.gpu_model} ({g.count})
            </option>
          ))}
        </select>
      </div>

      {/* Provider */}
      <div>
        <label style={labelStyle}>Provider</label>
        <select
          style={inputStyle}
          value={searchParams.get("provider") || ""}
          onChange={(e) => updateParam("provider", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        >
          <option value="">All Providers</option>
          {providers.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Max Price */}
      <div>
        <label style={labelStyle}>Max Price ($/mo)</label>
        <input
          type="number"
          style={inputStyle}
          placeholder="e.g. 500"
          value={searchParams.get("max_price") || ""}
          onChange={(e) => updateParam("max_price", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Min RAM */}
      <div>
        <label style={labelStyle}>Min RAM (GB)</label>
        <input
          type="number"
          style={inputStyle}
          placeholder="e.g. 64"
          value={searchParams.get("min_ram") || ""}
          onChange={(e) => updateParam("min_ram", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Min GPUs */}
      <div>
        <label style={labelStyle}>Min GPUs</label>
        <select
          style={inputStyle}
          value={searchParams.get("min_gpu_count") || ""}
          onChange={(e) => updateParam("min_gpu_count", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="8">8+</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/servers")}
          className="w-full py-2 text-xs font-medium rounded-md transition-colors"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          ✕ Clear filters
        </button>
      )}
    </aside>
  );
}
