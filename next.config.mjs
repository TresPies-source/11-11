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

    return config;
  },
};

export default nextConfig;
