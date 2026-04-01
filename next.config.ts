import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Include the SQLite database file in Vercel's serverless function bundles
  outputFileTracingIncludes: {
    "/servers": ["./src/data/**"],
    "/api/servers": ["./src/data/**"],
  },
};

export default nextConfig;
