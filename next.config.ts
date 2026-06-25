import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  swUrl: "/sw.js",
  scope: "/",
  register: false,
  reloadOnOnline: false,
  cacheOnNavigation: false,
  disable: process.env.NODE_ENV === "development",
  globPublicPatterns: [
    "brand/*.png",
    "icons/*.png",
    "offline.html",
  ],
  exclude: [
    /\.map$/,
    /^manifest.*\.js$/,
    /firebase-messaging-sw\.js$/,
    /sw\.js$/,
    /sw\.js\.map$/,
    ({ asset }: { asset: { name: string } }) => {
      const name = asset.name;
      if (!name.startsWith("static/chunks/app/")) return false;
      return ![
        "static/chunks/app/layout",
        "static/chunks/app/page",
        "static/chunks/app/(home)/overview/page",
        "static/chunks/app/offline/page",
        "static/chunks/app/_not-found/page",
      ].some((prefix) => name.startsWith(prefix));
    },
  ],
});

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(), microphone=(), payment=(), usb=(), bluetooth=()",
          },
        ],
      },
    ];
  },
  experimental: {
    staleTimes: {
      dynamic: 60,  // cache dynamically-rendered pages for 60s (was 0 in Next 15)
      static: 300,  // cache statically-rendered pages for 5m
    },
  },
  eslint: {
    // Disable linting during build to allow development to progress
    // ESLint issues should be fixed but don't block the build
    ignoreDuringBuilds: true,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Disable polling if in development to prevent HMR errors
    if (!isServer) {
      config.watchOptions = {
        poll: false,
        ignored: /node_modules/,
      };
    }

    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**", // Allow all paths
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withBundleAnalyzer(withSerwist(nextConfig));
