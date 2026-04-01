"use client";

import { useState } from "react";

// Map provider slug → domain for Clearbit logo API
const PROVIDER_DOMAINS: Record<string, string> = {
  "coreweave":      "coreweave.com",
  "datacrunch":     "datacrunch.io",
  "digitalocean":   "digitalocean.com",
  "fluidstack":     "fluidstack.io",
  "genesis":        "genesiscloud.com",
  "hetzner":        "hetzner.com",
  "hyperstack":     "hyperstack.cloud",
  "jarvislabs":     "jarvislabs.ai",
  "lambda-labs":    "lambdalabs.com",
  "latitude":       "latitude.sh",
  "oblivus":        "oblivus.com",
  "ovh":            "ovhcloud.com",
  "paperspace":     "paperspace.com",
  "runpod":         "runpod.io",
  "salad":          "salad.com",
  "scaleway":       "scaleway.com",
  "tensordock":     "tensordock.com",
  "thundercompute": "thundercompute.com",
  "vast":           "vast.ai",
  "vultr":          "vultr.com",
};

interface Props {
  slug: string;
  name: string;
  size?: number;
}

export default function ProviderLogo({ slug, name, size = 20 }: Props) {
  const [failed, setFailed] = useState(false);
  const domain = PROVIDER_DOMAINS[slug];

  if (!domain || failed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: 4,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          fontSize: size * 0.5,
          fontWeight: 700,
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: "contain",
        background: "#fff",
        flexShrink: 0,
      }}
    />
  );
}
