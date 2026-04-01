import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
          className="text-center py-2 text-xs font-medium"
          style={{
            background: "linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)",
            borderBottom: "1px solid rgba(99,102,241,0.12)",
            color: "var(--accent-light)",
          }}
        >
          <span className="opacity-60 mr-2">✦</span>
          Live GPU pricing from 16+ providers · Free to use
          <span className="opacity-60 ml-2">✦</span>
        </div>

        {/* ── Nav ── */}
        <nav
          className="sticky top-0 z-50"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "rgba(2,2,8,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <a href="/" className="flex items-center gap-2 group">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--cyan) 100%)",
                    color: "#fff",
                    boxShadow: "0 0 12px rgba(99,102,241,0.35)",
                  }}
                >
                  G
                </div>
                <span className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                  GPU<span style={{ color: "var(--accent-light)" }}>Hunt</span>
                </span>
                <span
                  className="badge badge-indigo hidden sm:inline-flex"
                  style={{ fontSize: "9px", padding: "1px 6px" }}
                >
                  BETA
                </span>
              </a>

              {/* Nav links */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[
                  { href: "/servers", label: "Servers" },
                  { href: "/use-case/llm-training", label: "Use Cases" },
                  { href: "/compare/lambda-labs-vs-runpod", label: "Compare" },
                  { href: "/api/servers", label: "API" },
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

              {/* CTA — hidden on mobile to avoid crowding */}
              <a
                href="/servers?min_gpu_count=1"
                className="btn-primary hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                Find a GPU
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid var(--border)", marginTop: "80px" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--cyan) 100%)", color: "#fff" }}
                  >
                    G
                  </div>
                  <span className="text-sm font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                    GPU<span style={{ color: "var(--accent-light)" }}>Hunt</span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  The fastest way to compare GPU and bare metal server prices across every major cloud provider.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Browse</p>
                <div className="space-y-2">
                  {[
                    { href: "/servers", label: "All Servers" },
                    { href: "/servers?min_gpu_count=1", label: "GPU Servers" },
                    { href: "/servers?gpu_model=NVIDIA+H100", label: "H100 Servers" },
                    { href: "/servers?gpu_model=NVIDIA+A100", label: "A100 Servers" },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="footer-link block text-xs transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Use Cases</p>
                <div className="space-y-2">
                  {[
                    { href: "/use-case/llm-training",    label: "LLM Training" },
                    { href: "/use-case/inference",        label: "AI Inference" },
                    { href: "/use-case/fine-tuning",      label: "Fine-Tuning" },
                    { href: "/use-case/image-generation", label: "Image Generation" },
                    { href: "/api/servers",               label: "JSON API" },
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
              <span>© 2025 GPUHunt. Not affiliated with any provider.</span>
              <span>Prices may vary. For reference only.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
