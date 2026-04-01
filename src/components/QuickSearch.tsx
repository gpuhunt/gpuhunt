"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  gpuFamilies: Array<{ family: string; label: string; cheapest: number | null }>;
}

export default function QuickSearch({ gpuFamilies }: Props) {
  const router = useRouter();
  const [gpu, setGpu] = useState("");
  const [budget, setBudget] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("min_gpu_count", "1");
    if (gpu) p.set("gpu_model", gpu);
    if (budget) p.set("max_price", String(parseFloat(budget) * 730)); // convert $/hr to $/mo
    router.push(`/servers?${p.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-2 w-full max-w-xl mx-auto"
    >
      {/* GPU selector */}
      <div className="relative flex-1">
        <select
          value={gpu}
          onChange={(e) => setGpu(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 pr-8 text-sm font-medium focus:outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: gpu ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          <option value="">Any GPU type</option>
          <optgroup label="Flagship / Data Center">
            {gpuFamilies
              .filter((g) => ["NVIDIA H200", "NVIDIA H100", "NVIDIA B200", "NVIDIA GH200", "NVIDIA A100", "AMD Instinct MI300X", "AMD Instinct MI325X"].includes(g.family))
              .map((g) => (
                <option key={g.family} value={g.family}>
                  {g.label}{g.cheapest != null ? ` — from $${g.cheapest.toFixed(2)}/hr` : ""}
                </option>
              ))}
          </optgroup>
          <optgroup label="Professional">
            {gpuFamilies
              .filter((g) => ["NVIDIA L40S", "NVIDIA L40", "NVIDIA A40", "NVIDIA L4", "NVIDIA A10"].includes(g.family))
              .map((g) => (
                <option key={g.family} value={g.family}>
                  {g.label}{g.cheapest != null ? ` — from $${g.cheapest.toFixed(2)}/hr` : ""}
                </option>
              ))}
          </optgroup>
          <optgroup label="Consumer / Budget">
            {gpuFamilies
              .filter((g) => ["NVIDIA RTX 4090", "NVIDIA RTX 4080", "NVIDIA RTX 3090"].includes(g.family))
              .map((g) => (
                <option key={g.family} value={g.family}>
                  {g.label}{g.cheapest != null ? ` — from $${g.cheapest.toFixed(2)}/hr` : ""}
                </option>
              ))}
          </optgroup>
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Budget */}
      <div className="relative sm:w-40">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--text-muted)" }}>
          $
        </span>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Max $/hr"
          min="0"
          step="0.5"
          className="w-full rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <button
        type="submit"
        className="btn-primary px-6 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 whitespace-nowrap"
      >
        Search
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </form>
  );
}
