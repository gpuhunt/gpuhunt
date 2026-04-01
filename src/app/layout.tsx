import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GpuHuntIcon } from "@/components/GpuHuntLogo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPUHunt — Compare GPU Server Prices",
  description:
    "Real-time GPU server pricing from Lambda Labs, CoreWeave, RunPod, Vast.ai, Hyperstack, and 16+ more providers. Find the cheapest H100, A100, MI300X, or RTX 4090 instantly.",
  openGraph: {
    title: "GPUHunt — Compare GPU Server Prices",
    description: "Real-time GPU server pricing across 16+ providers. Find the best deal for AI/ML.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col" style={{ background: "var(--background)", color: "var(--text-primary)" }}>

        {/* ── Top announcement bar ── */}
        <div
          className="text-center py-2 text-xs font-medium tracking-wide"
          style={{
            background: "linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 100%)",
            borderBottom: "1px solid rgba(99,102,241,0.1)",
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          Live GPU pricing from 16+ providers &nbsp;·&nbsp; Free to use
        </div>

        {/* ── Nav ── */}
        <nav
          className="sticky top-0 z-50"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "rgba(2,2,8,0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <a href="/" className="flex items-center gap-2.5 group">
                <GpuHuntIcon size={28} />
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}
                >
                  GPU<span style={{ color: "var(--accent-light)" }}>Hunt</span>
                </span>
              </a>

              {/* Nav links */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[
                  { href: "/servers",                       label: "Servers"    },
                  { href: "/use-case/llm-training",         label: "Use Cases"  },
                  { href: "/compare/lambda-labs-vs-runpod", label: "Compare"    },
                  { href: "/api/servers",                   label: "API"        },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="nav-link px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* CTA */}
              <a
                href="/servers?min_gpu_count=1"
                className="btn-primary hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                Find a GPU
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid var(--border)", marginTop: "80px" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">

              {/* Brand */}
              <div className="sm:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <GpuHuntIcon size={24} />
                  <span className="text-sm font-bold" style={{ letterSpacing: "-0.04em" }}>
                    GPU<span style={{ color: "var(--accent-light)" }}>Hunt</span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  The fastest way to compare GPU server prices across every major cloud provider.
                </p>
              </div>

              {/* Browse */}
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Browse</p>
                <div className="space-y-2.5">
                  {[
                    { href: "/servers",                      label: "All Servers"   },
                    { href: "/servers?min_gpu_count=1",      label: "GPU Servers"   },
                    { href: "/servers?gpu_model=NVIDIA+H100",label: "H100 Servers"  },
                    { href: "/servers?gpu_model=NVIDIA+A100",label: "A100 Servers"  },
                    { href: "/servers?gpu_model=AMD+Instinct+MI300X", label: "MI300X Servers" },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="footer-link block text-xs transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Use Cases</p>
                <div className="space-y-2.5">
                  {[
                    { href: "/use-case/llm-training",    label: "LLM Training"      },
                    { href: "/use-case/inference",        label: "AI Inference"      },
                    { href: "/use-case/fine-tuning",      label: "Fine-Tuning"       },
                    { href: "/use-case/image-generation", label: "Image Generation"  },
                    { href: "/use-case/embedding",        label: "Embeddings & RAG"  },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="footer-link block text-xs transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Compare + Dev */}
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Compare</p>
                <div className="space-y-2.5">
                  {[
                    { href: "/compare/lambda-labs-vs-runpod",      label: "Lambda vs RunPod"     },
                    { href: "/compare/coreweave-vs-lambda-labs",   label: "CoreWeave vs Lambda"  },
                    { href: "/compare/runpod-vs-vast",             label: "RunPod vs Vast.ai"    },
                    { href: "/compare/hyperstack-vs-lambda-labs",  label: "Hyperstack vs Lambda" },
                    { href: "/api/servers",                         label: "JSON API"             },
                    { href: "/methodology",                         label: "Methodology"          },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="footer-link block text-xs transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 text-xs"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <span>© {new Date().getFullYear()} GPUHunt. Not affiliated with any provider.</span>
              <span>Prices shown for reference only. Verify directly with providers.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
