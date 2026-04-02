import { BLOG_POSTS } from "@/lib/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GPU Cloud Blog — AI Infrastructure Guides & Comparisons",
  description:
    "Practical guides on GPU cloud pricing, LLM training costs, provider comparisons, and how to reduce your AI infrastructure spend.",
  openGraph: {
    title: "GPU Cloud Blog — GPUHunt",
    description: "Guides on GPU cloud pricing, LLM training, and AI infrastructure costs.",
  },
};

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "GPUHunt Blog",
    url: "https://gpu-hunt.com/blog",
    description: "Guides, comparisons, and analysis on GPU cloud pricing and AI infrastructure.",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `https://gpu-hunt.com/blog/${p.slug}`,
      datePublished: p.date,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <span style={{ color: "var(--accent)" }}>Blog</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ letterSpacing: "-0.03em" }}>
          GPU Cloud Guides
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Practical analysis on GPU pricing, LLM infrastructure, and how to get the most out of cloud compute.
        </p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block rounded-xl p-6 transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <span key={tag} className="badge badge-indigo" style={{ fontSize: "11px" }}>
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 leading-snug">
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span>·</span>
              <span>{post.readTime} min read</span>
              <span
                className="ml-auto text-xs font-medium transition-colors"
                style={{ color: "var(--accent)" }}
              >
                Read →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
