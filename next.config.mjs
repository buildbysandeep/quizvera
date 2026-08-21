/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium"],
  },

  outputFileTracingIncludes: {
    "/api/pdf": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**/*",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "@sparticuz/chromium": "commonjs @sparticuz/chromium",
      });
    }

    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
