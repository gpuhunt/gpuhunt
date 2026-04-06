import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gpu-hunt.com" }],
        destination: "https://gpu-hunt.com/:path*",
        permanent: true,
      },
    ];
  },
  // Include the SQLite database file in Vercel's serverless function bundles.
  // Only .db is needed — .db-shm and .db-wal are runtime-generated and gitignored.
  outputFileTracingIncludes: {
    "/servers": ["./src/data/gpuhunt.db"],
    "/api/servers": ["./src/data/gpuhunt.db"],
    "/api/alerts": ["./src/data/gpuhunt.db"],
    "/api/deals": ["./src/data/gpuhunt.db"],
    "/api/geo": ["./src/data/gpuhunt.db"],
    "/gpu/[model]": ["./src/data/gpuhunt.db"],
    "/provider/[slug]": ["./src/data/gpuhunt.db"],
    "/compare/[pair]": ["./src/data/gpuhunt.db"],
    "/use-case/[slug]": ["./src/data/gpuhunt.db"],
    "/best-value": ["./src/data/gpuhunt.db"],
    "/location/[region]": ["./src/data/gpuhunt.db"],
    "/gpus": ["./src/data/gpuhunt.db"],
    "/providers": ["./src/data/gpuhunt.db"],
  },
  // Exclude the macOS native binary from being bundled — Vercel rebuilds it for Linux
  outputFileTracingExcludes: {
    "/servers": ["./node_modules/better-sqlite3/build/Release/better_sqlite3.node"],
  },
};

export default nextConfig;
