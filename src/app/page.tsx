import { getServers, getGpuModels, getProviders, getServerCount } from "@/lib/db";

export default function HomePage() {
  const totalServers = getServerCount({ available_only: true });
  const gpuModels = getGpuModels();
  const providers = getProviders();
  const featuredGpuServers = getServers({
    min_gpu_count: 1,
    sort_by: "price_monthly",
    limit: 6,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden bg-grid">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(249,115,22,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
              style={{ background: "var(--accent)" }}
            />
            Live data · Updated every 6 hours
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
            Find the cheapest{" "}
            <span style={{ color: "var(--accent)" }}>GPU servers</span>
            <br />
            across every provider
          </h1>

          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            {totalServers.toLocaleString()} dedicated &amp; GPU servers from {providers.length} providers.
            No signup. No fluff. Just find your server.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/servers?min_gpu_count=1"
              className="btn-accent inline-flex items-center justify-center px-6 py-3 text-sm"
            >
              Browse GPU Servers →
            </a>
            <a
              href="/servers"
              className="btn-ghost inline-flex items-center justify-center px-6 py-3 text-sm"
            >
              All Servers
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="py-8"
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: totalServers.toLocaleString(), label: "Servers tracked" },
            { value: String(providers.length), label: "Providers" },
            { value: String(gpuModels.length), label: "GPU models" },
            { value: "6h", label: "Update frequency" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white tabular-nums">{stat.value}</div>
              <div
                className="text-xs mt-1 uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by GPU */}
      {gpuModels.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-1">Browse by GPU</h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              Click any GPU to see all available servers
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gpuModels.map((gpu) => (
                <a
                  key={gpu.gpu_model}
                  href={`/gpu/${encodeURIComponent(gpu.gpu_model)}`}
                  className="card-hover block p-4"
                >
                  <div className="text-sm font-semibold text-white truncate">{gpu.gpu_model}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {gpu.count} server{gpu.count !== 1 ? "s" : ""} available
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cheapest GPU Servers */}
      {featuredGpuServers.length > 0 && (
        <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-1">Cheapest GPU Servers</h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              Lowest priced GPU servers available right now
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredGpuServers.map((server) => (
                <div
                  key={server.id}
                  className="p-5 rounded-lg flex flex-col justify-between gap-3"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        {server.provider_name}
                      </span>
                      {server.location && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {server.location}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold mb-1" style={{ color: "var(--accent)" }}>
                      {server.gpu_count}× {server.gpu_model}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {[
                        server.cpu_cores && `${server.cpu_cores} cores`,
                        server.ram_gb && `${server.ram_gb} GB RAM`,
                        server.gpu_vram_gb && `${server.gpu_vram_gb} GB VRAM`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">
                        {server.currency === "EUR" ? "€" : "$"}
                        {server.price_monthly?.toFixed(0)}
                      </span>
                      <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                        /mo
                      </span>
                    </div>
                    <a
                      href={server.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent px-3 py-1.5 text-xs"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <a
                href="/servers?min_gpu_count=1"
                className="text-sm font-medium transition-opacity hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                View all GPU servers →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Providers */}
      <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Providers</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Aggregating live pricing from {providers.length} providers
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <a
                key={provider.id}
                href={`/provider/${provider.slug}`}
                className="card-hover block p-4"
              >
                <div className="text-sm font-semibold text-white">{provider.name}</div>
                {provider.description && (
                  <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {provider.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
