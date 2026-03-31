import { getProviders, getGpuModels } from "@/lib/db";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gpuhunt.com";

  const providers = getProviders();
  const gpuModels = getGpuModels();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/servers`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const providerPages: MetadataRoute.Sitemap = providers.map((p) => ({
    url: `${baseUrl}/provider/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const gpuPages: MetadataRoute.Sitemap = gpuModels.map((g) => ({
    url: `${baseUrl}/gpu/${encodeURIComponent(g.gpu_model)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...providerPages, ...gpuPages];
}
