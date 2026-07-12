import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.externals.push(
      'pino-pretty',
      'lokijs',
      'encoding',
      'accounts',
      '@base-org/account',
      '@metamask/connect-evm',
      'porto/internal',
      'porto',
      '@walletconnect/ethereum-provider'
    );
    return config;
  },
};

export default nextConfig;
