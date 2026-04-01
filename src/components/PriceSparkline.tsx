"use client";

interface DataPoint {
  recorded_at: string;
  min_price_hourly: number | null;
}

interface Props {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

export default function PriceSparkline({ data, width = 120, height = 36, color = "var(--accent)" }: Props) {
  const points = data.filter((d) => d.min_price_hourly != null) as Array<{ recorded_at: string; min_price_hourly: number }>;

  if (points.length < 2) {
    return (
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        Accumulating data…
      </span>
    );
  }

  const prices = points.map((p) => p.min_price_hourly);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * w;
    const y = pad + h - ((p.min_price_hourly - minP) / range) * h;
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");

  // Area fill path
  const first = coords[0].split(",");
  const last = coords[coords.length - 1].split(",");
  const area = `M${first[0]},${height - pad} L${polyline.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, "L$1,$2").slice(1)} L${last[0]},${height - pad} Z`;

  const current = prices[prices.length - 1];
  const prev = prices[0];
  const trend = current < prev ? "down" : current > prev ? "up" : "flat";
  const trendColor = trend === "down" ? "#22c55e" : trend === "up" ? "#f59e0b" : color;

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark-fill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current price dot */}
        <circle
          cx={parseFloat(last[0])}
          cy={parseFloat(last[1])}
          r="2.5"
          fill={trendColor}
        />
      </svg>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        <div style={{ color: trendColor, fontWeight: 600 }}>
          {trend === "down" ? "↓" : trend === "up" ? "↑" : "→"} ${current.toFixed(2)}/hr
        </div>
        <div>{points.length}d range</div>
      </div>
    </div>
  );
}
