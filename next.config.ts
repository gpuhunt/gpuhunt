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
  // Exclude files that must NOT be bundled into Vercel serverless functions:
  // - macOS native binary (Vercel rebuilds better-sqlite3 for Linux at deploy time)
  // - SQLite WAL files (.db-shm / .db-wal): stale WAL files cause SQLITE_CANTOPEN
  //   on Vercel's read-only Lambda filesystem. The scrape workflow checkpoints and
  //   removes them before deploy, but this exclude is belt-and-suspenders.
  outputFileTracingExcludes: {
    "/servers": [
      "./node_modules/better-sqlite3/build/Release/better_sqlite3.node",
      "./src/data/gpuhunt.db-shm",
      "./src/data/gpuhunt.db-wal",
    ],
    "/api/servers": [
      "./src/data/gpuhunt.db-shm",
      "./src/data/gpuhunt.db-wal",
    ],
    "/api/alerts": [
      "./src/data/gpuhunt.db-shm",
      "./src/data/gpuhunt.db-wal",
    ],
    "/api/deals": [
      "./src/data/gpuhunt.db-shm",
      "./src/data/gpuhunt.db-wal",
    ],
    "/api/geo": [
      "./src/data/gpuhunt.db-shm",
      "./src/data/gpuhunt.db-wal",
    ],
  },
};

export default nextConfig;
