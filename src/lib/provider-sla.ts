export interface ProviderSLA {
  uptime_sla: string;          // display string e.g. "99.9%", "No SLA", "~90-95%"
  uptime_numeric: number | null; // for color coding (0-100)
  support: string;
  billing: string[];
  sla_credits: boolean;
  gdpr: boolean;
  status_page: string | null;
  certifications: string[];    // SOC 2, ISO 27001, HIPAA, PCI-DSS, etc.
  interconnect: string | null; // InfiniBand, NVLink, etc.
  tier: "enterprise" | "startup" | "marketplace"; // rough trust tier
  notes: string;
}

const SLA_DATA: Record<string, ProviderSLA> = {
  "lambda-labs": {
    uptime_sla: "No SLA",
    uptime_numeric: null,
    support: "Email / ticket portal; dedicated access for reserved clusters",
    billing: ["Hourly on-demand", "Weekly (reserved clusters)"],
    sla_credits: false,
    gdpr: true,
    status_page: "https://status.lambda.ai",
    certifications: ["SOC 2"],
    interconnect: null,
    tier: "startup",
    notes: "No formal uptime guarantee. DPA available. No egress fees. Dedicated hardware only.",
  },
  "coreweave": {
    uptime_sla: "99.9%",
    uptime_numeric: 99.9,
    support: "Dedicated account team (enterprise); Mission Control managed service",
    billing: ["Hourly on-demand", "Multi-year reserved (15–25% discount)", "Spot (Kubernetes preemption)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.coreweave.com",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    interconnect: "NVIDIA Quantum-2 InfiniBand (up to 110,000 GPUs), NVLink (GB200 NVL72)",
    tier: "enterprise",
    notes: "Largest GPU cloud. EU data residency available. GPUDirect RDMA.",
  },
  "runpod": {
    uptime_sla: "99.99% (Secure Cloud)",
    uptime_numeric: 99.99,
    support: "Community + email; dedicated GPU clusters with custom SLAs for enterprise",
    billing: ["Per-second on-demand", "Spot (preemptible)", "Savings Plans"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://uptime.runpod.io",
    certifications: ["SOC 2 Type I", "HIPAA"],
    interconnect: null,
    tier: "startup",
    notes: "Two tiers: Community Cloud (cheap, best-effort) vs Secure Cloud (Tier 3/4 DCs, 99.99% SLA). HIPAA + GDPR verified 2024.",
  },
  "vast": {
    uptime_sla: "No SLA",
    uptime_numeric: null,
    support: "24/7 human support; Premium tier adds architecture consults",
    billing: ["Per-second (active)", "Per-second storage (charged when stopped)", "Serverless"],
    sla_credits: false,
    gdpr: true,
    status_page: null,
    certifications: ["SOC 2 Type II"],
    interconnect: null,
    tier: "marketplace",
    notes: "Peer marketplace — individual host reliability varies. Use Secure Cloud filter for vetted Tier 2–4 DCs. HIPAA BAAs available.",
  },
  "hyperstack": {
    uptime_sla: "100%",
    uptime_numeric: 100,
    support: "Email + phone; engineer-led support",
    billing: ["Per-minute (prepaid credits)", "Reserved (monthly invoice)", "Spot (20% discount)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.hyperstack.cloud",
    certifications: ["SOC 2 Type I"],
    interconnect: null,
    tier: "startup",
    notes: "EU/UK sovereign hosting, CLOUD Act–free. 100% renewable energy. Norway + Canada DCs. Credits must be claimed within 5 days of month-end.",
  },
  "datacrunch": {
    uptime_sla: "~99.9%",
    uptime_numeric: 99.9,
    support: "Dedicated Slack channel (cluster contracts); email/dashboard",
    billing: ["Per 10-minute block", "Long-term reserved (prepaid)", "Spot (~25% cheaper)"],
    sla_credits: true,
    gdpr: true,
    status_page: null,
    certifications: ["ISO 27001", "ISO 27017", "ISO 27018", "ISO 27701"],
    interconnect: null,
    tier: "startup",
    notes: "Rebranded to Verda (Nov 2025). Helsinki HQ, EU data sovereignty. 100% renewable energy. No egress fees.",
  },
  "hetzner": {
    uptime_sla: "99.9% (Cloud)",
    uptime_numeric: 99.9,
    support: "24/7 email (critical issues); phone/email Mon–Fri 8am–6pm CET",
    billing: ["Hourly (capped at monthly price)", "No annual prepay"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.hetzner.com",
    certifications: ["ISO 27001", "BSI C5"],
    interconnect: null,
    tier: "startup",
    notes: "SLA applies to Cloud Servers only — bare metal/dedicated has no formal SLA. Credits are Cloud Credits (non-cash). Germany + Finland DCs.",
  },
  "ovh": {
    uptime_sla: "99.5% (GPU / AI services)",
    uptime_numeric: 99.5,
    support: "Tiered support plans (Basic / Business / Enterprise); 24/7 for higher tiers",
    billing: ["Hourly on-demand", "Monthly reserved", "Annual reserved"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.ovhcloud.com",
    certifications: ["ISO 27001", "HDS", "PCI-DSS"],
    interconnect: null,
    tier: "enterprise",
    notes: "Largest European cloud by infrastructure. GPU/AI SLA credits capped at 30% of monthly invoice. EU data residency across France, UK, Germany, Poland.",
  },
  "vultr": {
    uptime_sla: "100%",
    uptime_numeric: 100,
    support: "24/7 technical support (avg 8-min response); 800+ KB articles",
    billing: ["Hourly on-demand", "Prepaid packages (15% discount)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.vultr.com",
    certifications: ["SOC 2", "ISO 27001", "PCI-DSS", "HIPAA"],
    interconnect: null,
    tier: "enterprise",
    notes: "100% uptime SLA with full monthly credit for affected instance. 32 global regions. Tier 3+ DCs. Credits non-cash, expire in 1 year.",
  },
  "digitalocean": {
    uptime_sla: "99% (GPU Droplets)",
    uptime_numeric: 99.0,
    support: "Tiered: Basic (email) / Standard (24/7 chat) / Business / Enterprise",
    billing: ["Hourly on-demand", "Bare metal GPU available"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.digitalocean.com",
    certifications: ["SOC 2 Type II", "SOC 3", "ISO 27001"],
    interconnect: null,
    tier: "enterprise",
    notes: "GPU Droplet SLA is only 99% — much lower than their CPU SLA (99.99%). Includes Paperspace (acquired 2023). H100, H200, L40S, B300 available.",
  },
  "paperspace": {
    uptime_sla: "99% (via DigitalOcean SLA)",
    uptime_numeric: 99.0,
    support: "Dedicated Account Manager at >$500/mo spend; community forum; email",
    billing: ["Per-hour (Machines)", "Per-second (Gradient Notebooks)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.digitalocean.com",
    certifications: ["SOC 1", "SOC 2", "PCI-DSS", "ISO 27001"],
    interconnect: null,
    tier: "enterprise",
    notes: "Fully integrated into DigitalOcean as of 2024. DigitalOcean support plans do not cover all legacy Paperspace products.",
  },
  "fluidstack": {
    uptime_sla: "99%",
    uptime_numeric: 99.0,
    support: "24/7 engineering support via Slack (15-min response SLA); fully managed Slurm/Kubernetes",
    billing: ["Hourly on-demand", "Monthly reserved", "Annual reserved (discounted)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.fluidstack.io",
    certifications: ["SOC 2 Type II", "ISO 27001", "HIPAA"],
    interconnect: "InfiniBand (12,000+ GPU single-job scale)",
    tier: "enterprise",
    notes: "No egress/ingress fees. Includes managed Slurm or Kubernetes. Single-tenant by default. H100/H200/B200/GB200 available.",
  },
  "scaleway": {
    uptime_sla: "99.5% (GPU Instances)",
    uptime_numeric: 99.5,
    support: "Support ticket via console; most issues responded to within 20 minutes",
    billing: ["Per-minute (GPU instances)", "Savings Plans (up to 25% discount)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.scaleway.com",
    certifications: ["ISO 27001"],
    interconnect: "NVLink (H100 4-GPU configs, Paris)",
    tier: "startup",
    notes: "EU-only DCs (Paris, Amsterdam, Warsaw). 100% renewable energy. CISPE member. SLA credit tiers: 95–99% → 25% credit; <95% → 100% credit.",
  },
  "latitude": {
    uptime_sla: "No % SLA (hardware repair within 8 hrs)",
    uptime_numeric: null,
    support: "24/7 support; credit clarification within 5 days",
    billing: ["Hourly", "Monthly (30-day intervals, in advance)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.latitude.sh",
    certifications: [],
    interconnect: null,
    tier: "startup",
    notes: "Credits = 2.5% of monthly fee per hour of downtime (capped at 100%). Bare metal focus. Part of Megaport Group. No refunds.",
  },
  "tensordock": {
    uptime_sla: "99.99% (host quality standard)",
    uptime_numeric: 99.99,
    support: "Email; 24-hour response commitment",
    billing: ["Per-second marketplace pricing", "Long-term subscription (discounted)"],
    sla_credits: true,
    gdpr: true,
    status_page: null,
    certifications: ["SOC 2 Type II", "HIPAA", "PCI-DSS"],
    interconnect: null,
    tier: "marketplace",
    notes: "Marketplace with vetted hosts (Tier 0–4). 45+ GPU models. Reliability depends on host selected. Prague DC for EU/GDPR workloads.",
  },
  "jarvislabs": {
    uptime_sla: "No SLA",
    uptime_numeric: null,
    support: "Email only",
    billing: ["Per-minute (active)", "Per-hour storage (when paused)"],
    sla_credits: false,
    gdpr: false,
    status_page: null,
    certifications: [],
    interconnect: null,
    tier: "startup",
    notes: "No SOC 2, no ISO 27001, no GDPR compliance documented. India + Finland servers. Data deleted if balance hits zero. Best for individual researchers/students. Not suitable for regulated workloads.",
  },
  "genesis": {
    uptime_sla: "99.0%",
    uptime_numeric: 99.0,
    support: "Email/ticket; dedicated solution expert consultation",
    billing: ["Per-minute on-demand", "Long-term reserved"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://genesiscloud.statuspage.io",
    certifications: ["ISO 27001"],
    interconnect: "InfiniBand (3.2 Tbps on HGX clusters)",
    tier: "startup",
    notes: "EU-sovereign cloud. Norway, France, Spain, Finland, USA, Canada DCs. No egress fees. EU AI Act compliant. SLA credits capped at 20% of monthly charges.",
  },
  "oblivus": {
    uptime_sla: "99.995% (Tier 4 DCs)",
    uptime_numeric: 99.995,
    support: "Email + ticket; Business ($1k+/mo): 8-hr response guarantee (High priority)",
    billing: ["Per-minute (prepaid)", "Reserved (up to 50% discount)"],
    sla_credits: true,
    gdpr: true,
    status_page: "https://status.oblivus.com",
    certifications: ["SOC 1 Type 2", "SOC 2 Type 2", "ISO 27001", "HIPAA"],
    interconnect: "InfiniBand 3,200 Gbps (Tier-4 DCs)",
    tier: "enterprise",
    notes: "100% single-tenant. Boston + Dallas (Tier 4), Montreal + Oslo DCs. H100 NVLink + PCIe, H200 SXM5. Crypto payments accepted.",
  },
  "thundercompute": {
    uptime_sla: "No published SLA",
    uptime_numeric: null,
    support: "Discord + email (founders); no formal support tiers",
    billing: ["Per-minute (all instances)"],
    sla_credits: false,
    gdpr: true,
    status_page: null,
    certifications: [],
    interconnect: null,
    tier: "startup",
    notes: "YC S24 startup. Two modes: Prototyping (50% cheaper, lower reliability) and Production (higher uptime). SOC 2 Type II audit in progress. H100 from $1.38/hr.",
  },
  "salad": {
    uptime_sla: "~90–95% per node",
    uptime_numeric: 92,
    support: "Discord community; email",
    billing: ["Per-second (running only)"],
    sla_credits: false,
    gdpr: true,
    status_page: "https://cloud-status.salad.com",
    certifications: ["SOC 2"],
    interconnect: null,
    tier: "marketplace",
    notes: "Distributed model: 60,000+ consumer GPUs across 190+ countries. Auto-reallocates on node failure. Best for stateless inference and batch jobs. Not suitable for latency-sensitive or regulated workloads.",
  },
};

export function getProviderSLA(slug: string): ProviderSLA | null {
  return SLA_DATA[slug] ?? null;
}

export function getAllProviderSLAs(): Record<string, ProviderSLA> {
  return SLA_DATA;
}

/** Color class for uptime value */
export function uptimeColor(uptime_numeric: number | null): string {
  if (uptime_numeric === null) return "var(--text-muted)";
  if (uptime_numeric >= 99.9) return "var(--green)";
  if (uptime_numeric >= 99.0) return "var(--accent-light)";
  return "var(--amber)";
}

/** Short uptime badge label */
export function uptimeBadgeClass(uptime_numeric: number | null): string {
  if (uptime_numeric === null) return "badge-muted";
  if (uptime_numeric >= 99.9) return "badge-green";
  if (uptime_numeric >= 99.0) return "badge-cyan";
  return "badge-amber";
}
