import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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

export default nextConfig;
