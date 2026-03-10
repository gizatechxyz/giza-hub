export const SERVER_NAME = 'giza-mcp-server';
export const SERVER_VERSION = '0.1.0';
export const DEFAULT_PORT = 3000;
export const ENV_PORT = 'PORT';

export const ENV_PRIVY_APP_ID = 'PRIVY_APP_ID';
export const ENV_PRIVY_APP_SECRET = 'PRIVY_APP_SECRET';
export const ENV_JWT_SECRET = 'JWT_SECRET';
export const ENV_MCP_DOMAIN = 'MCP_DOMAIN';
export const ACCESS_TOKEN_TTL_SEC = 3600;
export const REFRESH_TOKEN_TTL_SEC = 604_800;
export const AUTH_CODE_TTL_MS = 300_000;
export const JWT_ISSUER = SERVER_NAME;
export const JWT_AUDIENCE = 'giza-mcp';
export const CONFIRMATION_TOKEN_TTL_MS = 300_000;
export const SUPPORTED_SCOPES = ['mcp:tools'] as const;

export const SESSION_AUTH_TTL_MS = 3_600_000;
export const DEVICE_STATE_PREFIX = 'device:';

export const MAX_PENDING_SESSIONS = 10_000;
export const MAX_AUTH_CODES = 5_000;
export const MAX_SESSION_AUTH_ENTRIES = 10_000;
export const MAX_PENDING_OPERATIONS = 5_000;
export const MAX_PENDING_DEVICES = 10_000;
export const MAX_MCP_TRANSPORTS = 10_000;

export const ANNOTATIONS_READONLY = {
  readOnlyHint: true,
  idempotentHint: true,
} as const;

export const ANNOTATIONS_DESTRUCTIVE = {
  destructiveHint: true,
  openWorldHint: true,
} as const;

export const ANNOTATIONS_MUTATING = {
  openWorldHint: true,
} as const;

export const ANNOTATIONS_IDEMPOTENT_MUTATING = {
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const GIZA_INSTRUCTIONS = `You are helping a user manage their DeFi yield on Giza — a platform where autonomous agents optimize yield across DeFi protocols.

HOW GIZA WORKS: Users deposit stablecoins (USDC, USDT0) into an ERC-4337 smart account. An agent automatically rebalances across DeFi lending protocols (Aave, Compound, Morpho, etc.) to maximize yield using session keys — no repeated signatures needed. Giza charges a 10% performance fee on yield only. No fees on deposits, withdrawals, or rebalancing.

SUPPORTED CHAINS & TOKENS:
- Base: USDC (includes Giza Rewards — 15% minimum APR target)
- Arbitrum: USDC
- Plasma: USDT0
- HyperEVM: USDT0
Default to Base (chain ID 8453) if the user doesn't specify.

CHAIN IDS: Ethereum=1, Polygon=137, Base=8453, Arbitrum=42161, Sepolia=11155111.

RESPONSE STYLE: Be concise. Summarize data in 1-3 sentences. Show numbers, percentages, and key facts. Only show tables or full details when asked. Never dump raw JSON to the user.

WORKFLOW — New user:
1. giza_login → authenticate via wallet
2. giza_list_tokens (on chosen chain) → see available tokens
3. giza_list_protocols (for chosen token) → see available DeFi protocols
4. giza_create_agent → create smart account
5. User sends tokens to the smart account address
6. giza_activate_agent → provide tx hash, pick protocols, start optimization

WORKFLOW — Existing user:
- "How is my portfolio?": giza_get_portfolio
- "What's my yield/return?": giza_get_apr
- "What have I earned?": giza_list_rewards
- "Claim rewards": giza_claim_rewards → giza_confirm_operation
- "Withdraw": giza_withdraw → giza_confirm_operation
- "What happened?": giza_list_transactions

CRITICAL OPERATIONS: giza_withdraw, giza_deactivate_agent, and giza_claim_rewards return a confirmationToken. You MUST tell the user what will happen and get their explicit confirmation before calling giza_confirm_operation. Never auto-confirm.

AUTH: If any tool returns an auth error, call giza_login. It will return a login URL — show it to the user and ask them to open it in their browser. Retry after they confirm they've logged in.`;

export function getBaseUrl(): string {
  return (
    process.env[ENV_MCP_DOMAIN] ??
    `http://127.0.0.1:${process.env[ENV_PORT] ?? DEFAULT_PORT}`
  );
}
