interface Props {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

// GPU chip icon — 3 pins per side, 2×2 compute core grid, indigo→cyan gradient
export function GpuHuntIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chip-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="chip-grad-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f52d9" />
          <stop offset="100%" stopColor="#16b5cc" />
        </linearGradient>
      </defs>

      {/* Pins — top (3) */}
      <rect x="9"    y="2" width="2" height="4" rx="1" fill="#6366f1" opacity="0.55" />
      <rect x="15"   y="2" width="2" height="4" rx="1" fill="#6366f1" opacity="0.55" />
      <rect x="21"   y="2" width="2" height="4" rx="1" fill="#6366f1" opacity="0.55" />

      {/* Pins — bottom (3) */}
      <rect x="9"    y="26" width="2" height="4" rx="1" fill="#22d3ee" opacity="0.45" />
      <rect x="15"   y="26" width="2" height="4" rx="1" fill="#22d3ee" opacity="0.45" />
      <rect x="21"   y="26" width="2" height="4" rx="1" fill="#22d3ee" opacity="0.45" />

      {/* Pins — left (3) */}
      <rect x="2" y="9"  width="4" height="2" rx="1" fill="#6366f1" opacity="0.55" />
      <rect x="2" y="15" width="4" height="2" rx="1" fill="#6366f1" opacity="0.55" />
      <rect x="2" y="21" width="4" height="2" rx="1" fill="#6366f1" opacity="0.55" />

      {/* Pins — right (3) */}
      <rect x="26" y="9"  width="4" height="2" rx="1" fill="#22d3ee" opacity="0.45" />
      <rect x="26" y="15" width="4" height="2" rx="1" fill="#22d3ee" opacity="0.45" />
      <rect x="26" y="21" width="4" height="2" rx="1" fill="#22d3ee" opacity="0.45" />

      {/* Chip body */}
      <rect x="6" y="6" width="20" height="20" rx="3.5" fill="url(#chip-grad)" />

      {/* Inner shadow / depth */}
      <rect x="6" y="6" width="20" height="20" rx="3.5" fill="url(#chip-grad-dark)" opacity="0.25" />

      {/* 2×2 compute core grid */}
      <rect x="9"    y="9"    width="5.5" height="5.5" rx="1.2" fill="white" opacity="0.95" />
      <rect x="17.5" y="9"    width="5.5" height="5.5" rx="1.2" fill="white" opacity="0.6"  />
      <rect x="9"    y="17.5" width="5.5" height="5.5" rx="1.2" fill="white" opacity="0.6"  />
      <rect x="17.5" y="17.5" width="5.5" height="5.5" rx="1.2" fill="white" opacity="0.3"  />

      {/* Accent line — top-right highlight */}
      <path
        d="M22 6.5 Q25.5 6.5 25.5 10"
        stroke="white"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
}

export default function GpuHuntLogo({ size = 32, showWordmark = true, className }: Props) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <GpuHuntIcon size={size} />
      {showWordmark && (
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--text-primary)",
          }}
        >
          GPU
          <span style={{ color: "var(--accent-light)" }}>Hunt</span>
        </span>
      )}
    </div>
  );
}
