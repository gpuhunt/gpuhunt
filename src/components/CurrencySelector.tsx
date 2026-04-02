"use client";

import { useState, useEffect } from "react";

export type Currency = "USD" | "EUR";

const EUR_RATE = 0.92; // approximate USD → EUR

export function usePreferredCurrency(): [Currency, (c: Currency) => void] {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const stored = localStorage.getItem("gpuhunt_currency") as Currency | null;
    if (stored === "EUR" || stored === "USD") setCurrencyState(stored);
  }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    localStorage.setItem("gpuhunt_currency", c);
  }

  return [currency, setCurrency];
}

export function formatPrice(priceUsd: number, currency: Currency, originalCurrency?: string): string {
  if (originalCurrency === "EUR" || currency === "EUR") {
    const eur = originalCurrency === "EUR" ? priceUsd : priceUsd * EUR_RATE;
    return `€${eur.toFixed(2)}`;
  }
  return `$${priceUsd.toFixed(2)}`;
}

export default function CurrencySelector() {
  const [currency, setCurrency] = usePreferredCurrency();

  return (
    <div className="flex items-center rounded-lg overflow-hidden text-xs font-semibold"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      {(["USD", "EUR"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className="px-2.5 py-1.5 transition-colors"
          style={{
            background: currency === c ? "var(--accent)" : "transparent",
            color: currency === c ? "#fff" : "var(--text-muted)",
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
