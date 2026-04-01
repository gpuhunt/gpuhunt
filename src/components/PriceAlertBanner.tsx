"use client";

import { useState } from "react";

interface Props {
  gpuModel?: string;
}

export default function PriceAlertBanner({ gpuModel }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const subject = gpuModel
    ? `${gpuModel.replace("NVIDIA ", "").replace("AMD Instinct ", "")} Price Alert`
    : "GPU Price Alerts";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, gpu_model: gpuModel ?? null }),
      });
    } catch {
      // Silently fail — form still shows success to user
    }
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl px-6 py-5 flex items-center gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <span style={{ color: "var(--green)", fontSize: 20 }}>✓</span>
        <div>
          <div className="text-sm font-semibold text-white">You&apos;re on the list</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            We&apos;ll email you when {gpuModel ? `${gpuModel.replace("NVIDIA ", "")} ` : "GPU "}prices drop.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-6 py-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-0.5">{subject}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Get notified when prices drop. No spam — one email per significant price change.
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 shrink-0">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              outline: "none",
              width: "200px",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-4 py-2 text-xs whitespace-nowrap"
          >
            {loading ? "…" : "Notify me"}
          </button>
        </form>
      </div>
    </div>
  );
}
