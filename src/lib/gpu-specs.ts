export interface GpuSpec {
  architecture: string;
  vram_gb: number;
  vram_type: string;
  vram_bandwidth_tbs: number;   // TB/s
  fp16_tflops: number;
  tdp_w: number;
  nvlink: boolean;
  use_cases: string[];
  notes?: string;
}

// Canonical GPU specs for known AI/ML chips.
// Keyed by prefix — matches GPU_FAMILIES family names.
const GPU_SPECS: Record<string, GpuSpec> = {
  "NVIDIA B200": {
    architecture: "Blackwell",
    vram_gb: 192,
    vram_type: "HBM3e",
    vram_bandwidth_tbs: 8.0,
    fp16_tflops: 2250,
    tdp_w: 1000,
    nvlink: true,
    use_cases: ["LLM Training", "Inference", "Fine-tuning"],
    notes: "Latest Blackwell architecture. NVL72 rack-scale configs available.",
  },
  "NVIDIA H200": {
    architecture: "Hopper",
    vram_gb: 141,
    vram_type: "HBM3e",
    vram_bandwidth_tbs: 4.8,
    fp16_tflops: 989,
    tdp_w: 700,
    nvlink: true,
    use_cases: ["LLM Training", "Inference", "Fine-tuning"],
    notes: "Drop-in upgrade from H100 with 1.76× more memory bandwidth.",
  },
  "NVIDIA H100": {
    architecture: "Hopper",
    vram_gb: 80,
    vram_type: "HBM3",
    vram_bandwidth_tbs: 3.35,
    fp16_tflops: 989,
    tdp_w: 700,
    nvlink: true,
    use_cases: ["LLM Training", "Inference", "Fine-tuning"],
    notes: "SXM5 variant has NVLink 4.0 (900 GB/s). PCIe variant lacks NVSwitch.",
  },
  "NVIDIA A100": {
    architecture: "Ampere",
    vram_gb: 80,
    vram_type: "HBM2e",
    vram_bandwidth_tbs: 2.0,
    fp16_tflops: 312,
    tdp_w: 400,
    nvlink: true,
    use_cases: ["LLM Training", "Fine-tuning", "Inference"],
    notes: "80 GB SXM4 remains the workhorse for cost-efficient LLM training.",
  },
  "NVIDIA L40S": {
    architecture: "Ada Lovelace",
    vram_gb: 48,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.864,
    fp16_tflops: 362,
    tdp_w: 350,
    nvlink: false,
    use_cases: ["Inference", "Image Generation", "Fine-tuning"],
    notes: "Best inference throughput/dollar in the Ada lineup. No NVLink.",
  },
  "NVIDIA L40": {
    architecture: "Ada Lovelace",
    vram_gb: 48,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.864,
    fp16_tflops: 181,
    tdp_w: 300,
    nvlink: false,
    use_cases: ["Inference", "Image Generation", "Rendering"],
  },
  "NVIDIA L4": {
    architecture: "Ada Lovelace",
    vram_gb: 24,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.3,
    fp16_tflops: 121,
    tdp_w: 72,
    nvlink: false,
    use_cases: ["Inference", "Embeddings", "Small Models"],
    notes: "Low power, PCIe. Ideal for high-density inference deployments.",
  },
  "NVIDIA A40": {
    architecture: "Ampere",
    vram_gb: 48,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.696,
    fp16_tflops: 149.7,
    tdp_w: 300,
    nvlink: false,
    use_cases: ["Fine-tuning", "Image Generation", "Inference"],
  },
  "NVIDIA A10": {
    architecture: "Ampere",
    vram_gb: 24,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.6,
    fp16_tflops: 125,
    tdp_w: 150,
    nvlink: false,
    use_cases: ["Inference", "Embeddings", "Image Generation"],
  },
  "NVIDIA V100": {
    architecture: "Volta",
    vram_gb: 32,
    vram_type: "HBM2",
    vram_bandwidth_tbs: 0.9,
    fp16_tflops: 125,
    tdp_w: 300,
    nvlink: true,
    use_cases: ["Legacy Training", "Inference"],
    notes: "Previous generation. A100 is a strict upgrade at similar price points.",
  },
  "NVIDIA RTX 4090": {
    architecture: "Ada Lovelace",
    vram_gb: 24,
    vram_type: "GDDR6X",
    vram_bandwidth_tbs: 1.008,
    fp16_tflops: 165,
    tdp_w: 450,
    nvlink: false,
    use_cases: ["Image Generation", "Inference", "Fine-tuning (QLoRA)"],
    notes: "Highest consumer GPU for AI. NVLink not supported — single-GPU only.",
  },
  "NVIDIA RTX 3090": {
    architecture: "Ampere",
    vram_gb: 24,
    vram_type: "GDDR6X",
    vram_bandwidth_tbs: 0.936,
    fp16_tflops: 71,
    tdp_w: 350,
    nvlink: false,
    use_cases: ["Image Generation", "Inference", "Prototyping"],
  },
  "NVIDIA RTX 6000 Ada": {
    architecture: "Ada Lovelace",
    vram_gb: 48,
    vram_type: "GDDR6",
    vram_bandwidth_tbs: 0.96,
    fp16_tflops: 364,
    tdp_w: 300,
    nvlink: false,
    use_cases: ["Inference", "Fine-tuning", "Image Generation"],
    notes: "Professional Ada card. Same specs as L40S, different firmware.",
  },
  "AMD Instinct MI300X": {
    architecture: "CDNA3",
    vram_gb: 192,
    vram_type: "HBM3",
    vram_bandwidth_tbs: 5.3,
    fp16_tflops: 1307,
    tdp_w: 750,
    nvlink: false,
    use_cases: ["LLM Training", "Inference", "Fine-tuning"],
    notes: "192 GB unified HBM3 fits the largest open-source models on one GPU. ROCm software stack.",
  },
  "AMD Instinct MI325X": {
    architecture: "CDNA3",
    vram_gb: 256,
    vram_type: "HBM3e",
    vram_bandwidth_tbs: 6.0,
    fp16_tflops: 1307,
    tdp_w: 750,
    nvlink: false,
    use_cases: ["LLM Training", "Inference", "Fine-tuning"],
    notes: "256 GB HBM3e upgrade of MI300X. Best memory capacity of any shipping GPU.",
  },
  "AMD Instinct MI355X": {
    architecture: "CDNA3.5",
    vram_gb: 288,
    vram_type: "HBM3e",
    vram_bandwidth_tbs: 8.0,
    fp16_tflops: 2457,
    tdp_w: 750,
    nvlink: false,
    use_cases: ["LLM Training", "Inference"],
    notes: "Latest AMD flagship. Competes directly with H200 on memory bandwidth.",
  },
};

export function getGpuSpec(gpuFamily: string): GpuSpec | null {
  // Try exact match first, then prefix match
  for (const [key, spec] of Object.entries(GPU_SPECS)) {
    if (gpuFamily.startsWith(key)) return spec;
  }
  return null;
}

export { GPU_SPECS };
