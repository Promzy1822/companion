/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",       value: "SAMEORIGIN"                  },
          { key: "X-Content-Type-Options", value: "nosniff"                    },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection",       value: "1; mode=block"              },
          {
            key:   "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.vanguardngr.com"  },
      { protocol: "https", hostname: "**.punchng.com"      },
      { protocol: "https", hostname: "**.guardian.ng"      },
      { protocol: "https", hostname: "**.dailypost.ng"     },
    ],
  },

  async redirects() {
    return [
      { source: "/signup", destination: "/auth", permanent: true },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

module.exports = nextConfig;
