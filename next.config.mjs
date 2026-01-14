import bundleAnalyzer from '@next/bundle-analyzer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@electric-sql/pglite'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.unshift({
      test: /node_modules[\\\/]next-auth[\\\/]css[\\\/]index\.js$/,
      use: 'null-loader',
      enforce: 'pre',
    });

    // Handle SQL files for PGlite
    config.module.rules.push({
      test: /\.sql$/,
      type: 'asset/source',
    });

    // Configure experiments for WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add fallbacks for PGlite WebAssembly dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }

    // Ignore specific PGlite warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@electric-sql\/pglite/ },
      /The generated code contains 'async\/await'/,
    ];

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
