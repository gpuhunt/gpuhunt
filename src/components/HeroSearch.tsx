"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GpuFamily {
  family: string;
  label: string;
  cheapest: number | null;
}

interface Provider {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  gpuFamilies: GpuFamily[];
  providers: Provider[];
}

const USE_CASES = [
  { slug: "llm-training",    label: "LLM Training",       description: "H100, A100, MI300X" },
  { slug: "inference",        label: "AI Inference",        description: "L40S, L4, RTX 4090" },
  { slug: "fine-tuning",      label: "Fine-Tuning",         description: "A100, L40S, A40"    },
  { slug: "image-generation", label: "Image Generation",    description: "RTX 4090, A40, L40S" },
  { slug: "embedding",        label: "Embeddings & RAG",    description: "L4, A10, T4"        },
];

const PROVIDER_PAIRS = [
  ["lambda-labs", "runpod"],
  ["coreweave", "lambda-labs"],
  ["runpod", "vast"],
  ["hyperstack", "lambda-labs"],
];

export default function HeroSearch({ gpuFamilies, providers }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"gpu" | "compare" | "usecase">("gpu");

  // GPU tab state
  const [gpu, setGpu] = useState("");
  const [provider, setProvider] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [minGpus, setMinGpus] = useState("1");

  // Compare tab state
  const [provA, setProvA] = useState("");
  const [provB, setProvB] = useState("");

  // Use case tab state
  const [useCase, setUseCase] = useState("");

  function handleGpuSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("min_gpu_count", minGpus || "1");
    if (gpu) p.set("gpu_model", gpu);
    if (provider) p.set("provider", provider);
    if (maxHr) p.set("max_price", String(parseFloat(maxHr) * 730));
    router.push(`/servers?${p.toString()}`);
  }

  function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    if (provA && provB && provA !== provB) {
      router.push(`/compare/${provA}-vs-${provB}`);
    }
  }

  function handleUseCase(e: React.FormEvent) {
    e.preventDefault();
    if (useCase) router.push(`/use-case/${useCase}`);
  }

  const tabs = [
    {
      id: "gpu" as const, label: "GPU Servers",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>,
    },
    {
      id: "compare" as const, label: "Compare",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
    },
    {
      id: "usecase" as const, label: "Use Cases",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
  ];

  const fieldStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.12)",
    color: "var(--text-primary)",
    borderRadius: "12px",
    fontSize: "15px",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="w-full mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "rgba(6,6,14,0.96)",
        border: "1.5px solid rgba(99,102,241,0.3)",
        boxShadow: "0 32px 100px rgba(99,102,241,0.18), 0 12px 40px rgba(0,0,0,0.6)",
        backdropFilter: "blur(32px)",
      }}
    >
      {/* Tab bar */}
      <div
        className="flex"
        style={{ borderBottom: "1.5px solid rgba(99,102,241,0.16)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-all"
            style={{
              fontSize: "14px",
              color: tab === t.id ? "#fff" : "var(--text-muted)",
              background: tab === t.id ? "rgba(99,102,241,0.14)" : "transparent",
              borderBottom: tab === t.id ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              letterSpacing: "-0.01em",
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 sm:p-7">
        {/* ── GPU Servers tab ── */}
        {tab === "gpu" && (
          <form onSubmit={handleGpuSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* GPU type */}
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPU Model</label>
                <select
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  className="w-full appearance-none px-4 py-4 pr-10 focus:outline-none"
                  style={{
                    ...fieldStyle,
                    color: gpu ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <option value="">Any GPU type</option>
                  <optgroup label="Flagship / Data Center">
                    {gpuFamilies
                      .filter((g) => ["NVIDIA H200", "NVIDIA H100", "NVIDIA B200", "NVIDIA A100", "AMD Instinct MI300X", "AMD Instinct MI325X"].includes(g.family))
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
                <svg className="absolute right-4 bottom-4.5 pointer-events-none" style={{ bottom: "18px" }} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Provider */}
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full appearance-none px-4 py-4 pr-10 focus:outline-none"
                  style={{
                    ...fieldStyle,
                    color: provider ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <option value="">Any provider</option>
                  {providers.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
                <svg className="absolute right-4 pointer-events-none" style={{ bottom: "18px" }} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Max $/hr */}
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Max $/hr</label>
                <span className="absolute left-4 pointer-events-none font-semibold" style={{ bottom: "15px", color: "var(--text-muted)", fontSize: "15px" }}>$</span>
                <input
                  type="number"
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="No limit"
                  min="0"
                  step="0.5"
                  className="w-full pl-8 pr-4 py-4 focus:outline-none"
                  style={fieldStyle}
                />
              </div>

              {/* GPU count */}
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>GPUs / server</label>
                <select
                  value={minGpus}
                  onChange={(e) => setMinGpus(e.target.value)}
                  className="w-full appearance-none px-4 py-4 pr-10 focus:outline-none"
                  style={fieldStyle}
                >
                  <option value="1">1+ GPU</option>
                  <option value="2">2+ GPUs</option>
                  <option value="4">4+ GPUs</option>
                  <option value="8">8 GPUs (DGX)</option>
                </select>
                <svg className="absolute right-4 pointer-events-none" style={{ bottom: "18px" }} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className="btn-big-primary w-full gap-3"
              style={{ padding: "17px 24px", fontSize: "16px" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Search GPU Servers
            </button>
          </form>
        )}

        {/* ── Compare Providers tab ── */}
        {tab === "compare" && (
          <form onSubmit={handleCompare}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Provider A</label>
                <select
                  value={provA}
                  onChange={(e) => setProvA(e.target.value)}
                  required
                  className="w-full appearance-none px-4 py-4 pr-10 focus:outline-none"
                  style={{
                    ...fieldStyle,
                    color: provA ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
                <svg className="absolute right-4 pointer-events-none" style={{ bottom: "18px" }} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Provider B</label>
                <select
                  value={provB}
                  onChange={(e) => setProvB(e.target.value)}
                  required
                  className="w-full appearance-none px-4 py-4 pr-10 focus:outline-none"
                  style={{
                    ...fieldStyle,
                    color: provB ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
                <svg className="absolute right-4 pointer-events-none" style={{ bottom: "18px" }} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5l3 3 3-3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Quick pair suggestions */}
            <div className="mb-5">
              <div className="text-xs mb-2.5 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Popular comparisons:</div>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_PAIRS.map(([a, b]) => {
                  const pA = providers.find((p) => p.slug === a);
                  const pB = providers.find((p) => p.slug === b);
                  if (!pA || !pB) return null;
                  return (
                    <button
                      key={`${a}-${b}`}
                      type="button"
                      onClick={() => { setProvA(a); setProvB(b); }}
                      className="badge badge-muted transition-colors hover:border-accent"
                      style={{ cursor: "pointer", fontSize: "11px", padding: "4px 10px" }}
                    >
                      {pA.name} vs {pB.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!provA || !provB || provA === provB}
              className="btn-big-primary w-full gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: "17px 24px", fontSize: "16px" }}
            >
              Compare Providers
            </button>
          </form>
        )}

        {/* ── Use Cases tab ── */}
        {tab === "usecase" && (
          <form onSubmit={handleUseCase}>
            <label className="block text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>What are you building?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.slug}
                  type="button"
                  onClick={() => setUseCase(uc.slug)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: useCase === uc.slug ? "rgba(99,102,241,0.16)" : "rgba(255,255,255,0.04)",
                    border: useCase === uc.slug ? "1.5px solid rgba(99,102,241,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                    color: useCase === uc.slug ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <div>
                    <div className="font-semibold" style={{ fontSize: "13px" }}>{uc.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{uc.description}</div>
                  </div>
                  {useCase === uc.slug && (
                    <svg className="ml-auto shrink-0" width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="rgba(99,102,241,0.3)" stroke="var(--accent)" strokeWidth="1.5"/>
                      <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!useCase}
              className="btn-big-primary w-full gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: "17px 24px", fontSize: "16px" }}
            >
              Find Best GPUs
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
