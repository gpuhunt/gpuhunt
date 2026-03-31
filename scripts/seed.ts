import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "src", "data", "gpuhunt.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const now = new Date().toISOString();

const providers = [
  {
    id: "hetzner",
    name: "Hetzner",
    slug: "hetzner",
    website: "https://www.hetzner.com",
    affiliate_url: null,
    description: "German hosting provider known for excellent price-to-performance dedicated servers.",
  },
  {
    id: "ovh",
    name: "OVHcloud",
    slug: "ovh",
    website: "https://www.ovhcloud.com",
    affiliate_url: null,
    description: "European cloud provider with a large bare metal server catalog.",
  },
  {
    id: "lambda",
    name: "Lambda Labs",
    slug: "lambda-labs",
    website: "https://lambdalabs.com",
    affiliate_url: null,
    description: "GPU cloud provider focused on AI/ML workloads with NVIDIA GPU servers.",
  },
  {
    id: "vultr",
    name: "Vultr",
    slug: "vultr",
    website: "https://www.vultr.com",
    affiliate_url: "https://www.vultr.com/products/bare-metal/?ref=gpuhunt",
    description: "Global cloud provider with bare metal and GPU servers across 32 locations worldwide.",
  },
  {
    id: "runpod",
    name: "RunPod",
    slug: "runpod",
    website: "https://www.runpod.io",
    affiliate_url: "https://www.runpod.io/gpu-instance/pricing?utm_source=gpuhunt",
    description: "GPU cloud marketplace with competitive on-demand and spot pricing for AI/ML workloads.",
  },
];

const stmt = db.prepare(`
  INSERT OR REPLACE INTO providers (id, name, slug, website, affiliate_url, description, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const p of providers) {
  stmt.run(p.id, p.name, p.slug, p.website, p.affiliate_url, p.description, now);
}

console.log(`Seeded ${providers.length} providers.`);
db.close();
