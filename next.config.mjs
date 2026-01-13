import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Add fallbacks for PGlite WebAssembly dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'GOT.mem': false,
      'env': false,
      'wasi_snapshot_preview1': false,
    };

    // Ignore specific PGlite warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@electric-sql\/pglite/ },
    ];

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
