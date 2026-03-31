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
  title: "GPUHunt — Find & Compare GPU and Bare Metal Servers",
  description:
    "Compare GPU and dedicated server pricing across Hetzner, OVHcloud, Lambda Labs, and more. Find the best deal for your AI/ML workloads.",
  openGraph: {
    title: "GPUHunt — Find & Compare GPU and Bare Metal Servers",
    description:
      "Compare GPU and dedicated server pricing across providers. Find the best deal for AI/ML workloads.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="antialiased min-h-screen flex flex-col"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {/* Nav */}
        <nav
          className="sticky top-0 z-50 backdrop-blur-sm"
          style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.9)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-1 text-lg font-bold tracking-tight">
                <span style={{ color: "var(--accent)" }}>GPU</span>
                <span className="text-white">Hunt</span>
                <span
                  className="uppercase"
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    marginLeft: "6px",
                    marginTop: "3px",
                  }}
                >
                  beta
                </span>
              </a>
              <div className="flex items-center gap-5 text-sm">
                <a
                  href="/servers"
                  style={{ color: "var(--text-secondary)" }}
                  className="hover:text-white transition-colors hidden sm:block"
                >
                  All Servers
                </a>
                <a
                  href="/servers?min_gpu_count=1"
                  style={{ color: "var(--text-secondary)" }}
                  className="hover:text-white transition-colors hidden sm:block"
                >
                  GPU Servers
                </a>
                <a
                  href="/api/servers"
                  style={{ color: "var(--text-secondary)" }}
                  className="hover:text-white transition-colors hidden sm:block"
                >
                  API
                </a>
                <a
                  href="/servers"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)", color: "#000" }}
                >
                  Browse →
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 py-10" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-sm font-bold">
                <span style={{ color: "var(--accent)" }}>GPU</span>
                <span className="text-white">Hunt</span>
              </div>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Compare GPU &amp; bare metal server pricing. Updated every 6 hours.
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <a href="/api/servers" className="hover:text-white transition-colors">
                  API
                </a>
                <a href="mailto:support@gpu-hunt.com" className="hover:text-white transition-colors">
                  support@gpu-hunt.com
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
