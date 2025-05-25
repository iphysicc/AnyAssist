import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  distDir: "dist",

  // Tauri API paketlerini transpile et
  transpilePackages: [
    '@tauri-apps/api',
    '@tauri-apps/plugin-updater',
    '@tauri-apps/plugin-fs',
    '@tauri-apps/plugin-opener'
  ],

  // Tauri API'leri için webpack yapılandırması
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tauri API'lerini client-side'da kullanabilmek için
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Tauri API'lerini dinamik olarak içe aktarmak için
      config.experiments = {
        ...config.experiments,
        topLevelAwait: true,
      };
    }
    return config;
  },
};

export default nextConfig;
