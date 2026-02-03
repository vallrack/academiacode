import type {NextConfig} from 'next';
const path = require('path');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
   webpack: (config, { isServer, dev }) => {
    // Exclude three.js from server-side bundle
    if (isServer) {
      config.externals.push('three');
      config.externals.push('firebase-admin');
    }

    // Add support for glsl files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });

    if (!dev) {
      config.module.rules.push({
        test: path.resolve(__dirname, 'src/ai/dev.ts'),
        use: 'null-loader',
      });
    }

    return config;
  },
};

export default nextConfig;