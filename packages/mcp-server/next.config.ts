import type { NextConfig } from 'next';

const corsOrigin = process.env.CORS_ORIGIN ?? '*';

const corsHeaders = [
  { key: 'Access-Control-Allow-Origin', value: corsOrigin },
  { key: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization, mcp-session-id',
  },
  {
    key: 'Access-Control-Expose-Headers',
    value: 'mcp-session-id',
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
      {
        source: '/login-entry.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/login.css',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      { source: '/api/:path*', headers: corsHeaders },
      { source: '/.well-known/:path*', headers: corsHeaders },
      { source: '/authorize', headers: corsHeaders },
      { source: '/token', headers: corsHeaders },
      { source: '/register', headers: corsHeaders },
    ];
  },
};

export default nextConfig;
