import type { NextConfig } from "next";

/**
 * Next.js configuration with proxy settings for the heart-themed chatbot
 * Enables proxying API requests to avoid CORS issues and simplify endpoint URLs
 */
const nextConfig: NextConfig = {
  env: {
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  },
  
  // Configure async rewrites for API proxying
  async rewrites() {
    return [
      {
        // Proxy all /api/chat-proxy/* requests to the n8n webhook
        source: '/api/chat-proxy/:path*',
        destination: `${process.env.N8N_WEBHOOK_URL}:path*`,
      },
    ];
  },
};

export default nextConfig;
