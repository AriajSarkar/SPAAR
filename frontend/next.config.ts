import type { NextConfig } from "next";

/**
 * Next.js configuration with proxy settings for the heart-themed chatbot
 * Enables proxying API requests to avoid CORS issues and simplify endpoint URLs
 */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  
  // Configure async rewrites for API proxying
  async rewrites() {
    return [
      {
        // Proxy all /api/chat-proxy/* requests to the n8n webhook
        source: '/api/chat-proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}:path*`,
      },
    ];
  },
  
  // Enable response streaming
  experimental: {
    serverActions: {
      allowedOrigins: ['*'], // Be careful with this in production
    },
  },
  
  // Configure headers for streaming support
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Connection', value: 'keep-alive' },
          { key: 'Transfer-Encoding', value: 'chunked' },
        ],
      },
    ];
  },
};

export default nextConfig;
