/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security headers on every response ──────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          // Stop MIME-type sniffing
          { key: "X-Content-Type-Options",     value: "nosniff" },
          // Referrer policy — don't leak URL to third parties
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable features we don't use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Basic XSS protection for older browsers
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + inline (required for Next.js hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (required for inline styles throughout app)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs (base64) + https (Unsplash, news images)
              "img-src 'self' data: https:",
              // Fonts: self
              "font-src 'self'",
              // API calls: self + Groq + Google News + Nigerian news sites
              [
                "connect-src 'self'",
                "https://api.groq.com",
                "https://news.google.com",
                "https://www.vanguardngr.com",
                "https://punchng.com",
                "https://guardian.ng",
                "https://dailypost.ng",
                "https://www.thecable.ng",
                "https://finer-squid-81917.upstash.io",
              ].join(" "),
              // Media: self only
              "media-src 'self'",
              // Frames: none
              "frame-src 'none'",
              // Workers: self (service worker)
              "worker-src 'self'",
              // Manifest
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Image optimisation domains ───────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.vanguardngr.com"  },
      { protocol: "https", hostname: "**.punchng.com"      },
      { protocol: "https", hostname: "**.guardian.ng"      },
      { protocol: "https", hostname: "**.dailypost.ng"     },
    ],
  },

  // ── Redirects — /signup goes to /auth (we use /auth for all auth) ───────────
  async redirects() {
    return [
      {
        source:      "/signup",
        destination: "/auth",
        permanent:   true,
      },
    ];
  },

  // ── Compiler options ─────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keep console.error/warn)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

module.exports = nextConfig;
