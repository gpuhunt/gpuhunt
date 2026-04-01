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
  {
    id: "vast",
    name: "Vast.ai",
    slug: "vast",
    website: "https://vast.ai",
    affiliate_url: "https://vast.ai/console/create/?ref_id=gpuhunt",
    description: "Decentralized GPU marketplace with some of the lowest on-demand GPU prices available.",
  },
  {
    id: "tensordock",
    name: "TensorDock",
    slug: "tensordock",
    website: "https://tensordock.com",
    affiliate_url: "https://tensordock.com/deploy?ref=gpuhunt",
    description: "Low-cost GPU cloud provider with H100, A100, and consumer GPU instances.",
  },
  {
    id: "datacrunch",
    name: "DataCrunch",
    slug: "datacrunch",
    website: "https://datacrunch.io",
    affiliate_url: "https://datacrunch.io/cloud?utm_source=gpuhunt",
    description: "European GPU cloud with A100 and H100 servers hosted in Finland.",
  },
  {
    id: "fluidstack",
    name: "FluidStack",
    slug: "fluidstack",
    website: "https://fluidstack.io",
    affiliate_url: "https://www.fluidstack.io/pricing?utm_source=gpuhunt",
    description: "GPU cloud infrastructure provider with H100, A100, and RTX instances across US and EU.",
  },
  {
    id: "genesis",
    name: "Genesis Cloud",
    slug: "genesis",
    website: "https://www.genesiscloud.com",
    affiliate_url: "https://www.genesiscloud.com/pricing?utm_source=gpuhunt",
    description: "European GPU cloud provider with RTX 3080/3090 and A100 instances using renewable energy.",
  },
  {
    id: "salad",
    name: "Salad Cloud",
    slug: "salad",
    website: "https://salad.com",
    affiliate_url: "https://salad.com/gpu-pricing?utm_source=gpuhunt",
    description: "Distributed GPU cloud leveraging consumer gaming GPUs — some of the lowest prices for RTX 4090.",
  },
  {
    id: "coreweave",
    name: "CoreWeave",
    slug: "coreweave",
    website: "https://www.coreweave.com",
    affiliate_url: "https://www.coreweave.com/pricing",
    description: "High-performance GPU cloud built for AI/ML. Offers H100, H200, B200, and A100 across US datacenters.",
  },
  {
    id: "latitude",
    name: "Latitude.sh",
    slug: "latitude",
    website: "https://www.latitude.sh",
    affiliate_url: "https://www.latitude.sh/pricing?utm_source=gpuhunt",
    description: "Bare metal GPU servers with H100 and A100 across US and EU regions. Competitive hourly pricing.",
  },
  {
    id: "paperspace",
    name: "Paperspace",
    slug: "paperspace",
    website: "https://www.paperspace.com",
    affiliate_url: "https://www.paperspace.com/pricing?utm_source=gpuhunt",
    description: "DigitalOcean's GPU cloud platform offering A100, RTX A6000, A40, and V100 GPU instances.",
  },
  {
    id: "hyperstack",
    name: "Hyperstack",
    slug: "hyperstack",
    website: "https://www.hyperstack.cloud",
    affiliate_url: "https://www.hyperstack.cloud/gpu-pricing?utm_source=gpuhunt",
    description: "GPU cloud provider with H100, H200, A100, and L40S instances across US and EU regions.",
  },
  {
    id: "jarvislabs",
    name: "Jarvis Labs",
    slug: "jarvislabs",
    website: "https://jarvislabs.ai",
    affiliate_url: "https://jarvislabs.ai/pricing?utm_source=gpuhunt",
    description: "AI-focused GPU cloud with H100, H200, A100, and RTX 6000 instances. Competitive multi-GPU pricing.",
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
