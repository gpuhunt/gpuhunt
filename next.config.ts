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
  // Include the SQLite database file in Vercel's serverless function bundles
  outputFileTracingIncludes: {
    "/servers": ["./src/data/**"],
    "/api/servers": ["./src/data/**"],
    "/api/alerts": ["./src/data/**"],
    "/gpu/[model]": ["./src/data/**"],
    "/provider/[slug]": ["./src/data/**"],
    "/compare/[pair]": ["./src/data/**"],
    "/use-case/[slug]": ["./src/data/**"],
  },
};

export default nextConfig;
