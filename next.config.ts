import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com', // 修改 * 为 ** 以匹配子域
        pathname: '/**'
      }
    ]
  }
  // webpack(config, { isServer }) {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       fs: false, // 禁用 fs
  //       path: false, // 禁用 path
  //       os: false, // 禁用 os
  //       tls: false, // 禁用 tls
  //       net: false, // 禁用 net
  //       crypto: false // 禁用 crypto
  //     };
  //   }
  //   config.plugins.push(
  //     new (require('webpack').ProvidePlugin)({
  //       Buffer: ['buffer', 'Buffer']
  //     }),
  //     new (require('webpack').ProvidePlugin)({
  //       process: 'process/browser'
  //     })
  //   );
  //   return config;
  // }
};

export default nextConfig;
