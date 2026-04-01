"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterSidebarProps {
  gpuModels: { gpu_model: string; count: number }[];
  providers: { slug: string; name: string }[];
}

const controlStyle = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
  appearance: "none" as const,
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text-muted)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "7px",
};

function focus(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--accent)";
}
function blur(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--border)";
}

export default function FilterSidebar({ gpuModels, providers }: FilterSidebarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("offset");
    router.push(`/servers?${p.toString()}`);
  }, [router, sp]);

  const hasFilters = sp.get("gpu_model") || sp.get("provider") ||
    sp.get("max_price") || sp.get("min_ram") || sp.get("min_gpu_count");

  return (
    <aside className="w-full lg:w-56 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          Filters
        </span>
        {hasFilters && (
          <button
            onClick={() => router.push("/servers")}
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--accent-light)" }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* GPU Make */}
        <div>
          <label style={labelStyle}>GPU Make</label>
          <div className="flex gap-1.5">
            {[
              { label: "All",    value: "" },
              { label: "NVIDIA", value: "NVIDIA" },
              { label: "AMD",    value: "AMD Instinct" },
            ].map((opt) => {
              const currentMake = sp.get("gpu_model") || "";
              const isActive =
                opt.value === ""
                  ? !currentMake.startsWith("NVIDIA") && !currentMake.startsWith("AMD")
                  : currentMake.startsWith(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => update("gpu_model", opt.value)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isActive ? "var(--accent)" : "var(--surface-2)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* GPU Model */}
        <div>
          <label style={labelStyle}>GPU Model</label>
          <select
            style={controlStyle}
            value={sp.get("gpu_model") || ""}
            onChange={(e) => update("gpu_model", e.target.value)}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="">All GPUs</option>
            {gpuModels.map((g) => (
              <option key={g.gpu_model} value={g.gpu_model}>
                {g.gpu_model.replace("NVIDIA ", "").replace("AMD Instinct ", "")} ({g.count})
              </option>
            ))}
          </select>
        </div>

        {/* Provider */}
        <div>
          <label style={labelStyle}>Provider</label>
          <select
            style={controlStyle}
            value={sp.get("provider") || ""}
            onChange={(e) => update("provider", e.target.value)}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label style={labelStyle}>Max Price / mo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
            <input
              type="number"
              style={{ ...controlStyle, paddingLeft: "22px" }}
              placeholder="e.g. 5000"
              value={sp.get("max_price") || ""}
              onChange={(e) => update("max_price", e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Min RAM */}
        <div>
          <label style={labelStyle}>Min System RAM</label>
          <div className="relative">
            <input
              type="number"
              style={controlStyle}
              placeholder="e.g. 64"
              value={sp.get("min_ram") || ""}
              onChange={(e) => update("min_ram", e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--text-muted)" }}>GB</span>
          </div>
        </div>

        {/* Min GPUs */}
        <div>
          <label style={labelStyle}>Min GPU Count</label>
          <select
            style={controlStyle}
            value={sp.get("min_gpu_count") || ""}
            onChange={(e) => update("min_gpu_count", e.target.value)}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="4">4+</option>
            <option value="8">8+</option>
          </select>
        </div>

        {/* Use-case shortcuts */}
        <div>
          <label style={labelStyle}>By Use Case</label>
          <div className="flex flex-col gap-1.5">
            {[
              { href: "/use-case/llm-training",    label: "LLM Training" },
              { href: "/use-case/inference",        label: "Inference" },
              { href: "/use-case/fine-tuning",      label: "Fine-Tuning" },
              { href: "/use-case/image-generation", label: "Image Generation" },
              { href: "/use-case/embedding",        label: "Embeddings / RAG" },
            ].map((uc) => (
              <a
                key={uc.href}
                href={uc.href}
                className="text-xs px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  display: "block",
                  textDecoration: "none",
                }}
              >
                {uc.label} →
              </a>
            ))}
          </div>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div
            className="rounded-lg p-3 text-xs space-y-1"
            style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <div className="font-semibold" style={{ color: "var(--accent-light)" }}>Active filters</div>
            {sp.get("gpu_model") && <div style={{ color: "var(--text-secondary)" }}>GPU: {sp.get("gpu_model")}</div>}
            {sp.get("provider") && <div style={{ color: "var(--text-secondary)" }}>Provider: {sp.get("provider")}</div>}
            {sp.get("max_price") && <div style={{ color: "var(--text-secondary)" }}>Max: ${sp.get("max_price")}/mo</div>}
            {sp.get("min_ram") && <div style={{ color: "var(--text-secondary)" }}>RAM: {sp.get("min_ram")}+ GB</div>}
            {sp.get("min_gpu_count") && <div style={{ color: "var(--text-secondary)" }}>GPUs: {sp.get("min_gpu_count")}+</div>}
          </div>
        )}
      </div>
    </aside>
  );
}
