import { BLOG_POSTS } from "@/lib/blog-posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found — GPUHunt" };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: `https://gpu-hunt.com/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "GPUHunt",
      url: "https://gpu-hunt.com",
    },
    publisher: {
      "@type": "Organization",
      name: "GPUHunt",
      url: "https://gpu-hunt.com",
    },
    keywords: post.tags.join(", "),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "GPUHunt", item: "https://gpu-hunt.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://gpu-hunt.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://gpu-hunt.com/blog/${post.slug}` },
    ],
  };

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  // FAQ schema — shows expandable Q&As directly in Google search results (rich snippets)
  const faqLd = post.faqs && post.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        <a href="/" className="hover:text-white transition-colors">GPUHunt</a>
        <span>/</span>
        <a href="/blog" className="hover:text-white transition-colors">Blog</a>
        <span>/</span>
        <span style={{ color: "var(--accent)", maxWidth: "200px" }} className="truncate">{post.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="badge badge-indigo" style={{ fontSize: "11px" }}>
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4 leading-tight" style={{ letterSpacing: "-0.03em" }}>
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>·</span>
          <span>{post.readTime} min read</span>
        </div>
      </div>

      {/* Content */}
      <article className="prose-gpu">
        {post.sections.map((section, i) => {
          if (section.type === "h2") {
            return (
              <h2 key={i} className="text-xl font-semibold text-white mt-10 mb-4" style={{ letterSpacing: "-0.02em" }}>
                {section.content}
              </h2>
            );
          }
          if (section.type === "h3") {
            return (
              <h3 key={i} className="text-base font-semibold text-white mt-6 mb-3">
                {section.content}
              </h3>
            );
          }
          if (section.type === "p") {
            return (
              <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {section.content}
              </p>
            );
          }
          if (section.type === "ul") {
            return (
              <ul key={i} className="space-y-2 mb-6 pl-0">
                {section.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }}>→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }
          if (section.type === "ol") {
            return (
              <ol key={i} className="space-y-2 mb-6 pl-0">
                {section.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span
                      className="font-bold tabular-nums shrink-0 w-5 text-right"
                      style={{ color: "var(--accent)" }}
                    >
                      {j + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            );
          }
          if (section.type === "table" && section.headers && section.rows) {
            return (
              <div key={i} className="overflow-x-auto mb-6 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                      {section.headers.map((h, j) => (
                        <th
                          key={j}
                          className="text-left px-4 py-3 font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, j) => (
                      <tr
                        key={j}
                        style={{ borderBottom: j < section.rows!.length - 1 ? "1px solid var(--border)" : "none" }}
                      >
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="px-4 py-3 text-sm"
                            style={{ color: k === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (section.type === "callout") {
            return (
              <div
                key={i}
                className="rounded-lg px-5 py-4 mb-6 text-sm leading-relaxed"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="font-semibold" style={{ color: "var(--accent-light)" }}>💡 </span>
                {section.content}
              </div>
            );
          }
          if (section.type === "cta" && section.href) {
            return (
              <div
                key={i}
                className="rounded-lg px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {section.content}
                </span>
                <a
                  href={section.href}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap shrink-0"
                >
                  {section.label ?? "View →"}
                </a>
              </div>
            );
          }
          return null;
        })}
      </article>

      {/* FAQ section — rendered visually AND as JSON-LD for Google rich snippets */}
      {post.faqs && post.faqs.length > 0 && (
        <div className="mt-12 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {post.faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="font-semibold text-sm text-white mb-2">{faq.q}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related posts */}
      {otherPosts.length > 0 && (
        <div className="mt-14 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--text-muted)" }}>
            More Guides
          </h3>
          <div className="space-y-3">
            {otherPosts.map((p) => (
              <a
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="flex items-start justify-between gap-4 rounded-lg p-4 transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div>
                  <div className="text-sm font-medium text-white mb-1">{p.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.readTime} min read
                  </div>
                </div>
                <span className="text-xs shrink-0 mt-1" style={{ color: "var(--accent)" }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
