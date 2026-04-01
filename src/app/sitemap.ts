import { getProviders, getGpuModels } from "@/lib/db";
import type { MetadataRoute } from "next";

const USE_CASE_SLUGS = [
  "llm-training",
  "inference",
  "fine-tuning",
  "image-generation",
  "embedding",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gpu-hunt.com";

  const providers = getProviders();
  const gpuModels = getGpuModels();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                     lastModified: now, changeFrequency: "daily",  priority: 1    },
    { url: `${baseUrl}/servers`,        lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${baseUrl}/methodology`,    lastModified: now, changeFrequency: "monthly",priority: 0.6  },
  ];

  const providerPages: MetadataRoute.Sitemap = providers.map((p) => ({
    url: `${baseUrl}/provider/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  const gpuPages: MetadataRoute.Sitemap = gpuModels.map((g) => ({
    url: `${baseUrl}/gpu/${encodeURIComponent(g.gpu_model)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // /compare/[a]-vs-[b] — all ordered pairs
  const comparePairs: MetadataRoute.Sitemap = [];
  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      comparePairs.push({
        url: `${baseUrl}/compare/${providers[i].slug}-vs-${providers[j].slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.75,
      });
    }
  }

  const useCasePages: MetadataRoute.Sitemap = USE_CASE_SLUGS.map((slug) => ({
    url: `${baseUrl}/use-case/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...useCasePages, ...providerPages, ...gpuPages, ...comparePairs];
}
