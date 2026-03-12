import type { NextConfig } from 'next';

const mcpDomain = process.env.MCP_DOMAIN ?? '*';

const corsHeaders = [
  { key: 'Access-Control-Allow-Origin', value: mcpDomain },
  { key: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization, mcp-session-id',
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['@privy-io/node', 'jose'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      { source: '/api/:path*', headers: corsHeaders },
      { source: '/.well-known/:path*', headers: corsHeaders },
    ];
  },
};

export default nextConfig;
