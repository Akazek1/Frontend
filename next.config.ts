import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com", // Only the domain name
        pathname: "/**", // Allowing any path under this domain
      },
    ],
  },
};

export default nextConfig;
