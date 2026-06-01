import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet must not be bundled for SSR (maps load client-only).
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "leaflet", "react-leaflet"];
    }
    return config;
  },
};

export default nextConfig;
